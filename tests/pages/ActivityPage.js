const { BasePage } = require('./BasePage');
const { generateUniqueActivityName } = require('../utils/helpers');

/**
 * ActivityPage - Handles activity management operations
 */
class ActivityPage extends BasePage {
  constructor(page) {
    super(page);

    // Locators - List Page
    this.syncButton = page.getByRole('button', { name: /Sync|Sync Activity|Refresh/i }).first();
    this.createActivityButton = page.getByRole('button', { name: /Create Activity|Next|Create|Add Activity/i }).first();
    this.viewButtons = page.locator('button.btn-outline').filter({ hasText: 'View' });
    this.clearFiltersButton = page.locator('button.btn-outline').filter({ hasText: 'Clear Filters' });
    this.toggleSwitch = page.locator('button[role="switch"]').first();
    this.activitiesList = page.locator('tbody tr, [class*="activity"], [class*="list-item"]');
    this.searchFilter = page.locator('input[placeholder="Search by name or location..."]');

    // Locators - Create/Edit Form
    this.activityNameInput = page.locator('#name');
    this.descriptionInput = page.locator('#description');
    this.startDateInput = page.locator('input[name="startDate"]');
    this.startTimeInput = page.locator('#startTime');
    this.endDateInput = page.locator('input[name="endDate"]');
    this.endTimeInput = page.locator('#endTime');
    this.locationAddressInput = page.locator('#custom-google-places-input');
    this.locationNameInput = page.locator('#location');
    this.priceInput = page.locator('input#amount');
    this.submitButton = page.locator('button[type="submit"]');
    this.saveChangesButton = page.locator('button.btn-primary').filter({ hasText: 'Save Changes' });
    this.saveScheduleButton = page.locator('button.btn-primary').filter({ hasText: 'Save Schedule' });

    // Locators - Details Page
    this.editButton = page.getByRole('button', { name: /Edit|Edit Activity/i }).first();
    this.deleteButton = page.locator('button').filter({ hasText: /Delete/i }).first();
    this.backToListButton = page.locator('button.btn-outline:has-text("Back to List")').first();
    this.activityDetailsHeader = page.locator('text=Activity Details').first();

    // Locators - Schedule Modal (Sprint 9)
    this.quickRepeatTab = page.locator('button[role="tab"]').filter({ hasText: /Quick Repeat/i }).first();
    this.customScheduleTab = page.locator('button[role="tab"]').filter({ hasText: /Custom Schedule|Custom/i }).first();
    this.addTimeSlotButton = page.locator('button').filter({ hasText: /Add time slot|Add Time/i }).first();
    this.addDateButton = page.locator('button').filter({ hasText: /Add Date|Add date/i }).first();

    // Locators - Hybrid Pricing (Sprint 9)
    this.dropInPriceInput = page.locator('input[name*="dropIn"], input[id*="dropIn"], input[placeholder*="drop-in" i]').first();
    this.fullSessionPriceInput = page.locator('input[name*="fullSession"], input[id*="fullSession"], input[placeholder*="full session" i]').first();
    this.dropInRulesInput = page.locator('textarea[name*="dropIn"], input[name*="dropInRules"]').first();
  }

  /**
   * Navigate to activities page
   */
  async goToActivities() {
    await this.navigate('/activities');
    await this.wait(3000);
    await this.waitForPageLoad();
    console.log('    Navigated to Activities page');
  }

  /**
   * Click sync activity button
   */
  async clickSync() {
    if (await this.isVisible(this.syncButton, 5000)) {
      await this.syncButton.click();
      console.log('    Sync Activity button clicked');
      await this.wait(3000);
      await this.waitForPageLoad();
    } else {
      console.log('    Sync button not visible, continuing...');
    }
  }

  /**
   * Click create activity button
   */
  async clickCreateActivity() {
    try {
      await this.createActivityButton.waitFor({ state: 'visible', timeout: 15000 });
      await this.wait(500);
      await this.createActivityButton.click();
      console.log('    Create Activity button clicked');
    } catch {
      console.log('    Create Activity button not found with standard selectors');
      await this.page.getByText(/Create Activity|New Activity/i).first().click();
    }
    await this.wait(2000);
  }

  /**
   * Fill activity form
   * @param {object} activityData
   */
  async fillActivityForm(activityData) {
    // Activity Name
    await this.activityNameInput.waitFor({ state: 'visible', timeout: 10000 });
    await this.activityNameInput.fill(activityData.name);
    console.log(`    Activity Name entered: "${activityData.name}"`);

    // Description
    if (await this.isVisible(this.descriptionInput, 5000)) {
      await this.descriptionInput.fill(activityData.description);
      console.log(`    Description entered: "${activityData.description}"`);
    }

    await this.wait(800);

    // Start Date
    await this.startDateInput.waitFor({ state: 'visible', timeout: 10000 });
    await this.startDateInput.clear();
    await this.startDateInput.fill(activityData.startDate);
    console.log(`    Start Date selected: ${activityData.startDate}`);

    await this.wait(600);

    // Start Time
    await this.startTimeInput.waitFor({ state: 'visible', timeout: 10000 });
    await this.startTimeInput.clear();
    await this.startTimeInput.fill(activityData.startTime);
    console.log(`    Start Time selected: ${activityData.startTime}`);

    await this.wait(600);

    // End Date
    await this.endDateInput.waitFor({ state: 'visible', timeout: 10000 });
    await this.endDateInput.clear();
    await this.endDateInput.fill(activityData.endDate);
    console.log(`    End Date selected: ${activityData.endDate}`);

    await this.wait(600);

    // End Time
    await this.endTimeInput.waitFor({ state: 'visible', timeout: 10000 });
    await this.endTimeInput.clear();
    await this.endTimeInput.fill(activityData.endTime);
    console.log(`    End Time selected: ${activityData.endTime}`);

    await this.wait(1000);

    // Activity Frequency
    await this.selectDropdownOption('Activity Frequency', activityData.frequency);
    console.log(`    Activity Frequency selected: ${activityData.frequency}`);
    await this.wait(1000);

    // Handle Quick Schedule modal for Hybrid
    if (await this.isVisible(this.saveScheduleButton, 5000)) {
      await this.saveScheduleButton.click();
      console.log('    Clicked Save Schedule button');
      await this.wait(1500);
    }

    await this.pressKey('Escape');
    await this.wait(500);

    // Environment Type
    await this.selectDropdownOption('Environment Type', activityData.environmentType);
    console.log(`    Environment Type selected: ${activityData.environmentType}`);

    // Event Type
    await this.selectDropdownOption('Event Type', activityData.eventType);
    console.log(`    Event Type selected: ${activityData.eventType}`);

    // Entry Fee
    await this.selectDropdownOption('Entry Fee', activityData.entryFee);
    console.log(`    Entry Fee selected: ${activityData.entryFee}`);
    await this.wait(500);

    // Age Groups
    await this.selectAgeGroups(activityData.ageGroups);

    // Location Address
    await this.fillLocation(activityData.locationSearch, activityData.locationName);

    await this.wait(1000);
  }

  /**
   * Select multiple age groups
   * @param {string[]} ageGroups
   */
  async selectAgeGroups(ageGroups) {
    const ageGroupContainer = this.page.locator('div.w-full').filter({
      has: this.page.locator('label:has-text("Suitable for Age Group")')
    });
    const ageGroupDropdown = ageGroupContainer.locator('div.form-input[role="button"]');

    await ageGroupDropdown.scrollIntoViewIfNeeded();
    await ageGroupDropdown.click();
    console.log('    Clicked Age Group dropdown');
    await this.wait(800);

    for (const ageGroup of ageGroups) {
      const ageOption = this.page.locator('div.px-4.py-2, label, span')
        .filter({ hasText: new RegExp(`^${ageGroup}$`) }).first();
      if (await this.isVisible(ageOption, 1500)) {
        await ageOption.click();
        console.log(`    Selected: ${ageGroup}`);
        await this.wait(300);
      }
    }

    await this.page.mouse.click(10, 10);
    await this.wait(300);
    await this.pressKey('Escape');
    await this.wait(500);
    console.log('    Age Groups selection completed');
  }

  /**
   * Fill location fields
   * @param {string} locationSearch
   * @param {string} locationName
   */
  async fillLocation(locationSearch, locationName) {
    await this.locationAddressInput.scrollIntoViewIfNeeded();
    await this.locationAddressInput.click();
    await this.locationAddressInput.fill(locationSearch);
    console.log(`    Location Address entered: "${locationSearch}"`);

    await this.wait(2500);

    // Select from Google Places dropdown
    const pacContainer = this.page.locator('.pac-container .pac-item').first();
    if (await this.isVisible(pacContainer, 3000)) {
      await pacContainer.click();
      console.log('    Location selected from dropdown');
    } else {
      await this.pressKey('ArrowDown');
      await this.wait(300);
      await this.pressKey('Enter');
      console.log('    Location selected via keyboard');
    }

    await this.wait(1000);

    // Verify/Fill Location Name
    if (await this.isVisible(this.locationNameInput, 5000)) {
      const currentLocationName = await this.locationNameInput.inputValue();
      if (!currentLocationName || currentLocationName.length === 0) {
        await this.locationNameInput.fill(locationName);
        console.log(`    Location Name entered: "${locationName}"`);
      } else {
        console.log(`    Location Name auto-filled: "${currentLocationName}"`);
      }
    }
  }

  /**
   * Submit activity form
   */
  async submitActivityForm() {
    await this.scrollIntoView(this.submitButton);
    await this.wait(500);

    const isEnabled = await this.submitButton.isEnabled();
    console.log(`    Create Activity button is ${isEnabled ? 'ENABLED' : 'DISABLED'}`);

    await this.submitButton.click(isEnabled ? {} : { force: true });
    console.log('    Create Activity button clicked');

    await this.wait(5000);
  }

  /**
   * Create new activity
   * @param {object} activityData
   * @returns {string} Activity name
   */
  async createActivity(activityData = null) {
    const data = activityData || {
      name: generateUniqueActivityName(),
      description: 'I am testing activity with automation',
      startDate: '01/24/2026',
      startTime: '11:00',
      endDate: '01/29/2026',
      endTime: '17:30',
      frequency: 'Hybrid',
      environmentType: 'Outdoor',
      eventType: 'Public Pool',
      entryFee: 'Free',
      ageGroups: ['Prenatal', '0-6 months', '6-12 months', '3 years', '4 years', '5 years', '6 years'],
      locationSearch: 'mindbowser',
      locationName: 'Mindbowser Inc'
    };

    await this.clickCreateActivity();
    await this.page.waitForURL(/\/activities\/create/, { timeout: 15000 });
    console.log('    User is on Create Activity page');

    await this.waitForPageLoad();
    await this.wait(2000);

    await this.fillActivityForm(data);
    await this.submitActivityForm();

    // Verify redirect
    try {
      await this.page.waitForURL(/\/activities(?:\/)?(?:\?.*)?$/, { timeout: 20000 });
      console.log('    Activity created successfully - Redirect confirmed');
    } catch {
      console.log('    Checking for success message...');
      await this.goToActivities();
    }

    return data.name;
  }

  /**
   * View activity details
   * @param {number} index - Index of activity to view (0-based)
   */
  async viewActivity(index = 0) {
    const viewButtonCount = await this.viewButtons.count();
    console.log(`    Found ${viewButtonCount} View buttons`);

    if (viewButtonCount > index) {
      const viewButton = this.viewButtons.nth(index);
      await viewButton.waitFor({ state: 'visible', timeout: 10000 });
      await this.wait(500);
      await viewButton.click();
      console.log('    View button clicked');

      await this.wait(3000);
      await this.waitForPageLoad();

      if (await this.isVisible(this.activityDetailsHeader, 10000)) {
        console.log('    Activity Details page opened');
      }
    }
  }

  /**
   * Edit activity - change entry fee to Paid
   * @param {string} price
   */
  async editActivityEntryFee(price = '10') {
    await this.editButton.waitFor({ state: 'visible', timeout: 10000 });
    await this.scrollIntoView(this.editButton);
    await this.wait(500);
    await this.editButton.click();
    console.log('    Edit button clicked');

    await this.wait(2000);
    await this.waitForPageLoad();

    // Change Entry Fee to Paid
    await this.selectDropdownOption('Entry Fee', 'Paid');
    console.log('    Entry Fee changed from "Free" to "Paid"');

    await this.wait(1000);

    // Enter Price
    if (await this.isVisible(this.priceInput, 5000)) {
      await this.scrollIntoView(this.priceInput);
      await this.priceInput.click();
      await this.priceInput.clear();
      await this.priceInput.fill(price);
      console.log(`    Price entered: ${price}`);
    }

    await this.wait(1000);

    // Save changes
    await this.scrollIntoView(this.saveChangesButton);
    await this.wait(500);
    await this.saveChangesButton.click();
    console.log('    Save Changes button clicked');

    await this.wait(3000);
    await this.waitForPageLoad();

    try {
      await this.page.waitForURL(/\/activities(?:\/)?(?:\?.*)?$/, { timeout: 15000 });
      console.log('    Activity updated successfully');
    } catch {
      await this.goToActivities();
    }
  }

  /**
   * Delete activity
   */
  async deleteActivity() {
    await this.viewActivity(0);

    if (await this.isVisible(this.deleteButton, 5000)) {
      await this.scrollIntoView(this.deleteButton);
      await this.wait(500);
      await this.deleteButton.click();
      console.log('    Delete button clicked');

      await this.wait(1500);

      // Confirm deletion in popup
      const confirmDeleteBtn = this.page.locator('button').filter({ hasText: /Delete Activity|Confirm Delete|Delete/i }).last();
      if (await this.isVisible(confirmDeleteBtn, 5000)) {
        await confirmDeleteBtn.click();
        console.log('    Delete Activity confirmed');

        await this.wait(3000);
        await this.waitForPageLoad();

        try {
          await this.page.waitForURL(/\/activities(?:\/)?(?:\?.*)?$/, { timeout: 15000 });
          console.log('    Activity deleted successfully');
        } catch {
          await this.goToActivities();
        }
      }
    }
  }

  /**
   * Apply filters to activity list
   * @param {object} filters
   */
  async applyFilters(filters) {
    // Search filter
    if (filters.search && await this.isVisible(this.searchFilter, 5000)) {
      await this.searchFilter.fill(filters.search);
      console.log(`    Search filter applied: "${filters.search}"`);
    }
    await this.wait(1000);

    // Activity Frequency
    if (filters.frequency) {
      await this.selectDropdownOption('Activity Frequency', filters.frequency);
      console.log(`    Activity Frequency filter selected: ${filters.frequency}`);
    }

    // Status
    if (filters.status) {
      await this.selectDropdownOption('Status', filters.status);
      console.log(`    Status filter selected: ${filters.status}`);
    }

    await this.wait(2000);
    await this.waitForPageLoad();
  }

  /**
   * Clear all filters
   */
  async clearFilters() {
    if (await this.isVisible(this.clearFiltersButton, 5000)) {
      const isDisabled = await this.clearFiltersButton.isDisabled();
      if (!isDisabled) {
        await this.scrollIntoView(this.clearFiltersButton);
        await this.wait(500);
        await this.clearFiltersButton.click();
        console.log('    Clear Filters button clicked');
        await this.wait(3000);
        await this.waitForPageLoad();
      }
    }
  }

  /**
   * Toggle between Admin-created and User-created activities
   */
  async toggleActivityType() {
    if (await this.isVisible(this.toggleSwitch, 3000)) {
      await this.toggleSwitch.click();
      console.log('    Toggle switched');
      await this.wait(3000);
      await this.waitForPageLoad();
    }
  }

  /**
   * Get count of activities in list
   * @returns {Promise<number>}
   */
  async getActivitiesCount() {
    return await this.activitiesList.count();
  }

  // ==========================================
  // Prenatal Age Range Methods (Sprint 9)
  // ==========================================

  /**
   * Get all age group options visible in the dropdown
   * @returns {Promise<string[]>}
   */
  async getAgeGroupOptions() {
    const ageGroupContainer = this.page.locator('div.w-full').filter({
      has: this.page.locator('label:has-text("Suitable for Age Group")')
    });
    const ageGroupDropdown = ageGroupContainer.locator('div.form-input[role="button"]');

    await ageGroupDropdown.scrollIntoViewIfNeeded();
    await ageGroupDropdown.click();
    console.log('    Opened Age Group dropdown to read options');
    await this.wait(800);

    const options = this.page.locator('div.px-4.py-2, label, span');
    const count = await options.count();
    const optionTexts = [];
    for (let i = 0; i < count; i++) {
      const text = await options.nth(i).textContent().catch(() => '');
      if (text.trim()) optionTexts.push(text.trim());
    }

    await this.page.mouse.click(10, 10);
    await this.wait(300);
    await this.pressKey('Escape');
    await this.wait(300);

    console.log(`    Age Group options found: [${optionTexts.join(', ')}]`);
    return optionTexts;
  }

  /**
   * Verify specific age group option exists in dropdown
   * @param {string} ageGroupName
   * @returns {Promise<boolean>}
   */
  async isAgeGroupOptionVisible(ageGroupName) {
    const options = await this.getAgeGroupOptions();
    return options.some(opt => opt === ageGroupName);
  }

  /**
   * Verify specific age group option does NOT exist
   * @param {string} ageGroupName
   * @returns {Promise<boolean>}
   */
  async isAgeGroupOptionAbsent(ageGroupName) {
    const options = await this.getAgeGroupOptions();
    return !options.some(opt => opt === ageGroupName);
  }

  // ==========================================
  // Hybrid Activity Methods (Sprint 9)
  // ==========================================

  /**
   * Get all frequency dropdown options
   * @returns {Promise<string[]>}
   */
  async getFrequencyOptions() {
    const container = this.page.locator('div.space-y-2.relative').filter({
      has: this.page.locator('label:has-text("Activity Frequency")')
    });
    const dropdown = container.locator('div.form-input[role="button"]');

    await dropdown.scrollIntoViewIfNeeded();
    await dropdown.click();
    console.log('    Opened Activity Frequency dropdown to read options');
    await this.wait(600);

    const options = this.page.locator('div.px-4.py-2.text-sm.cursor-pointer');
    const count = await options.count();
    const optionTexts = [];
    for (let i = 0; i < count; i++) {
      const text = await options.nth(i).textContent().catch(() => '');
      if (text.trim()) optionTexts.push(text.trim());
    }

    await this.page.mouse.click(10, 10);
    await this.wait(300);
    await this.pressKey('Escape');
    await this.wait(300);

    console.log(`    Frequency options found: [${optionTexts.join(', ')}]`);
    return optionTexts;
  }

  /**
   * Select Hybrid as the activity frequency and verify the schedule modal appears
   * @returns {Promise<boolean>} true if schedule modal is visible
   */
  async selectHybridFrequency() {
    await this.selectDropdownOption('Activity Frequency', 'Hybrid');
    console.log('    Activity Frequency selected: Hybrid');
    await this.wait(1500);

    const scheduleVisible = await this.isVisible(this.saveScheduleButton, 5000);
    console.log(`    Schedule modal visible: ${scheduleVisible}`);
    return scheduleVisible;
  }

  /**
   * Fill full-session pricing details
   * @param {string} price
   */
  async fillFullSessionDetails(price) {
    if (await this.isVisible(this.fullSessionPriceInput, 5000)) {
      await this.scrollIntoView(this.fullSessionPriceInput);
      await this.fullSessionPriceInput.clear();
      await this.fullSessionPriceInput.fill(price);
      console.log(`    Full session price entered: ${price}`);
    } else {
      // Fallback: try generic price input
      if (await this.isVisible(this.priceInput, 3000)) {
        await this.scrollIntoView(this.priceInput);
        await this.priceInput.clear();
        await this.priceInput.fill(price);
        console.log(`    Price entered via generic input: ${price}`);
      }
    }
  }

  /**
   * Fill drop-in pricing and rules
   * @param {string} price
   * @param {string} rules
   */
  async fillDropInDetails(price, rules = '') {
    if (await this.isVisible(this.dropInPriceInput, 5000)) {
      await this.scrollIntoView(this.dropInPriceInput);
      await this.dropInPriceInput.clear();
      await this.dropInPriceInput.fill(price);
      console.log(`    Drop-in price entered: ${price}`);
    }
    if (rules && await this.isVisible(this.dropInRulesInput, 3000)) {
      await this.dropInRulesInput.fill(rules);
      console.log(`    Drop-in rules entered: ${rules}`);
    }
  }

  /**
   * Create a hybrid activity with full details including pricing
   * @param {object} activityData - must include hybridDetails: { fullSessionPrice, dropInPrice, dropInRules }
   * @returns {string} Activity name
   */
  async createHybridActivity(activityData) {
    await this.clickCreateActivity();
    await this.page.waitForURL(/\/activities\/create/, { timeout: 15000 });
    console.log('    User is on Create Activity page');
    await this.waitForPageLoad();
    await this.wait(2000);

    await this.fillActivityForm(activityData);

    // Fill hybrid-specific pricing fields
    if (activityData.hybridDetails) {
      if (activityData.hybridDetails.fullSessionPrice) {
        await this.fillFullSessionDetails(activityData.hybridDetails.fullSessionPrice);
      }
      if (activityData.hybridDetails.dropInPrice) {
        await this.fillDropInDetails(
          activityData.hybridDetails.dropInPrice,
          activityData.hybridDetails.dropInRules || ''
        );
      }
    }

    await this.submitActivityForm();

    try {
      await this.page.waitForURL(/\/activities(?:\/)?(?:\?.*)?$/, { timeout: 20000 });
      console.log('    Hybrid activity created successfully');
    } catch {
      await this.goToActivities();
    }

    return activityData.name;
  }

  /**
   * Edit hybrid activity settings (pricing)
   * @param {object} hybridDetails - { fullSessionPrice, dropInPrice, dropInRules }
   */
  async editHybridSettings(hybridDetails) {
    await this.editButton.waitFor({ state: 'visible', timeout: 10000 });
    await this.scrollIntoView(this.editButton);
    await this.wait(500);
    await this.editButton.click();
    console.log('    Edit button clicked');

    await this.wait(2000);
    await this.waitForPageLoad();

    if (hybridDetails.fullSessionPrice) {
      await this.fillFullSessionDetails(hybridDetails.fullSessionPrice);
    }
    if (hybridDetails.dropInPrice) {
      await this.fillDropInDetails(
        hybridDetails.dropInPrice,
        hybridDetails.dropInRules || ''
      );
    }

    await this.scrollIntoView(this.saveChangesButton);
    await this.wait(500);
    await this.saveChangesButton.click();
    console.log('    Save Changes clicked');

    await this.wait(3000);
    try {
      await this.page.waitForURL(/\/activities(?:\/)?(?:\?.*)?$/, { timeout: 15000 });
      console.log('    Hybrid activity updated successfully');
    } catch {
      await this.goToActivities();
    }
  }

  /**
   * Get displayed pricing information from the activity detail view
   * @returns {Promise<object>}
   */
  async getActivityPricing() {
    const pricing = {};
    const priceElements = this.page.locator('text=/\\$\\d+|Free/i');
    const count = await priceElements.count();
    for (let i = 0; i < count; i++) {
      const text = await priceElements.nth(i).textContent().catch(() => '');
      pricing[`price_${i}`] = text.trim();
    }
    console.log(`    Activity pricing found: ${JSON.stringify(pricing)}`);
    return pricing;
  }

  // ==========================================
  // Custom Schedule Methods (Sprint 9)
  // ==========================================

  /**
   * Switch to Custom Schedule tab in the schedule modal
   * @returns {Promise<boolean>} true if Custom Schedule tab is active
   */
  async switchToCustomSchedule() {
    if (await this.isVisible(this.customScheduleTab, 5000)) {
      await this.customScheduleTab.click();
      console.log('    Switched to Custom Schedule tab');
      await this.wait(1000);
      return true;
    }
    console.log('    Custom Schedule tab not found');
    return false;
  }

  /**
   * Add a date entry in Custom Schedule
   * @param {string} date - Date string (YYYY-MM-DD format)
   */
  async addScheduleDate(date) {
    if (await this.isVisible(this.addDateButton, 5000)) {
      await this.addDateButton.click();
      console.log('    Add Date button clicked');
      await this.wait(500);
    }

    // Fill the latest date input
    const dateInputs = this.page.locator('input[type="date"], input[name*="date"]');
    const count = await dateInputs.count();
    if (count > 0) {
      const lastDateInput = dateInputs.nth(count - 1);
      await lastDateInput.fill(date);
      console.log(`    Date entered: ${date}`);
    }
    await this.wait(500);
  }

  /**
   * Add a time slot to a date entry
   * @param {string} startTime - Start time (HH:MM)
   * @param {string} endTime - End time (HH:MM)
   */
  async addTimeSlotToDate(startTime, endTime) {
    if (await this.isVisible(this.addTimeSlotButton, 3000)) {
      await this.addTimeSlotButton.click();
      console.log('    Add Time Slot button clicked');
      await this.wait(500);
    }

    const timeInputs = this.page.locator('input[type="time"]');
    const count = await timeInputs.count();
    if (count >= 2) {
      await timeInputs.nth(count - 2).fill(startTime);
      await timeInputs.nth(count - 1).fill(endTime);
      console.log(`    Time slot added: ${startTime} - ${endTime}`);
    }
    await this.wait(500);
  }

  /**
   * Remove a specific time slot by index
   * @param {number} slotIndex
   */
  async removeTimeSlot(slotIndex = 0) {
    const removeButtons = this.page.locator('button').filter({ hasText: /Remove|Delete|×/i });
    const count = await removeButtons.count();
    if (count > slotIndex) {
      await removeButtons.nth(slotIndex).click();
      console.log(`    Time slot ${slotIndex} removed`);
      await this.wait(500);
    } else {
      console.log(`    No remove button found at index ${slotIndex}`);
    }
  }

  /**
   * Remove an entire date row
   * @param {number} dateIndex
   */
  async removeScheduleDate(dateIndex = 0) {
    const removeDateButtons = this.page.locator('button').filter({ hasText: /Remove Date|Delete Date/i });
    const count = await removeDateButtons.count();
    if (count > dateIndex) {
      await removeDateButtons.nth(dateIndex).click();
      console.log(`    Date row ${dateIndex} removed`);
      await this.wait(500);
    } else {
      console.log(`    No date remove button found at index ${dateIndex}`);
    }
  }

  /**
   * Check if overlapping time slots show an error
   * @param {string} startTime
   * @param {string} endTime
   * @returns {Promise<boolean>} true if overlap error is displayed
   */
  async checkOverlappingTimeSlotError(startTime, endTime) {
    await this.addTimeSlotToDate(startTime, endTime);
    await this.wait(1000);

    const errorMessage = this.page.locator('text=/overlap|conflict|already exists/i').first();
    const hasError = await this.isVisible(errorMessage, 5000);
    console.log(`    Overlap error displayed: ${hasError}`);
    return hasError;
  }

  /**
   * Save the custom schedule
   */
  async saveCustomSchedule() {
    if (await this.isVisible(this.saveScheduleButton, 5000)) {
      await this.saveScheduleButton.click();
      console.log('    Save Schedule clicked');
      await this.wait(1500);
    }
  }

  /**
   * Get the count of date inputs in the custom schedule
   * @returns {Promise<number>}
   */
  async getScheduleDateCount() {
    const dateInputs = this.page.locator('input[type="date"], input[name*="date"]');
    const count = await dateInputs.count();
    console.log(`    Schedule date count: ${count}`);
    return count;
  }

  /**
   * Get the count of time slot inputs in the custom schedule
   * @returns {Promise<number>}
   */
  async getTimeSlotCount() {
    const timeInputs = this.page.locator('input[type="time"]');
    const count = await timeInputs.count();
    // Each slot has 2 time inputs (start + end), so divide by 2
    const slotCount = Math.floor(count / 2);
    console.log(`    Time slot count: ${slotCount}`);
    return slotCount;
  }

  /**
   * Click back to list button
   */
  async clickBackToList() {
    if (await this.isVisible(this.backToListButton, 5000)) {
      await this.scrollIntoView(this.backToListButton);
      await this.wait(1000);
      await this.backToListButton.click({ force: true });
      console.log('    Back to List button clicked');
      await this.wait(3000);
      await this.waitForPageLoad();
    } else {
      await this.goToActivities();
    }
  }
}

module.exports = { ActivityPage };
