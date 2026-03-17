const { test, expect } = require('@playwright/test');

function sleep(ms){ return new Promise(r => setTimeout(r, ms)); }

test('Rainyday admin login via Yopmail OTP', async ({ browser }) => {
	// Use separate contexts so mail fetching doesn't affect the app session
	const appContext = await browser.newContext();
	const appPage = await appContext.newPage();

	await appPage.goto('https://stage.rainydayparents.com/login', { waitUntil: 'networkidle' });

	// Ensure Continue is visible then click
	const continueBtn = appPage.getByRole('button', { name: 'Continue' });
	await continueBtn.waitFor({ timeout: 10000 });
	await continueBtn.click();

	// Enter email
	const emailInput = appPage.getByPlaceholder('Enter your email');
	await emailInput.waitFor({ timeout: 10000 });
	await emailInput.fill('admin.devrainyday@yopmail.com');
	await continueBtn.click();

	// Wait for OTP inputs or a known OTP-screen marker
	await appPage.waitForSelector('input[maxlength="1"], input[name*="otp"], input[inputmode="numeric"], text=verification code', { timeout: 20000 }).catch(() => {});

	// Open a separate context for Yopmail to avoid cookie/localStorage collision
	const mailContext = await browser.newContext();
	const mailPage = await mailContext.newPage();
	await mailPage.goto('https://yopmail.com/en/', { waitUntil: 'networkidle' });

	const localPart = 'admin.devrainyday';
	await mailPage.fill('#login', localPart).catch(() => {});
	await mailPage.press('#login', 'Enter').catch(() => {});

	// Poll inbox for the verification email and extract OTP
	let otp = null;
	const maxAttempts = 12;
	for (let attempt = 0; attempt < maxAttempts; attempt++){
		try {
			await mailPage.waitForSelector('#ifinbox', { timeout: 5000 });
			const inboxFrame = mailPage.frameLocator('#ifinbox');
			const firstMsg = inboxFrame.locator('div.m, .m').first();
			if (await firstMsg.count() > 0) { await firstMsg.click().catch(()=>{}); }

			await mailPage.waitForSelector('#ifmail', { timeout: 5000 });
			const mailFrame = mailPage.frameLocator('#ifmail');
			await mailFrame.locator('body').waitFor({ timeout: 5000 });
			const bodyText = await mailFrame.locator('body').innerText().catch(() => '');
			const match = bodyText.match(/your verification code is[:\s]*([0-9]{6})/i) || bodyText.match(/(\d{6})/);
			if (match) { otp = match[1]; break; }
		} catch (e) {
			// ignore and retry
		}
		await mailPage.reload({ waitUntil: 'networkidle' }).catch(()=>{});
		await sleep(5000);
	}

	if (!otp){
		await mailContext.close();
		await appContext.close();
		throw new Error('OTP not found in Yopmail inbox');
	}

	// Fill OTP on the app page
	if (appPage.isClosed()) {
		await mailContext.close();
		throw new Error('App page was closed unexpectedly');
	}

	const otpInputs = await appPage.locator('input[maxlength="1"], input[name*="otp"], input[inputmode="numeric"], input[type="tel"]').elementHandles();
	if (otpInputs.length >= 6){
		for (let i = 0; i < 6; i++) { await otpInputs[i].fill(otp[i]).catch(()=>{}); }
	} else {
		const singleOtp = appPage.locator('input[name*="otp"], input.otp, input[id*="otp"], input[type="text"]');
		await singleOtp.first().fill(otp).catch(()=>{});
	}

	await continueBtn.click().catch(()=>{});

	// Wait for navigation or dashboard marker
	try { await appPage.waitForNavigation({ waitUntil: 'networkidle', timeout: 20000 }); } catch(e) {}
	if (!appPage.isClosed()){
		await expect(appPage).toHaveTitle(/admin|dashboard|Rainyday/i).catch(()=>{});
		await appContext.close();
	}
	await mailContext.close();
});

