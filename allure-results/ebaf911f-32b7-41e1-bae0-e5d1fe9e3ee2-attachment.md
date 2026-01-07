# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e3]:
    - generic [ref=e4]:
      - img "Background pattern" [ref=e6]
      - img "Rainyday Logo" [ref=e8]
    - generic [ref=e9]:
      - generic [ref=e10]:
        - heading "Welcome" [level=1] [ref=e11]
        - paragraph [ref=e12]:
          - text: Welcome to the Rainyday Admin Portal.
          - text: Click the Continue button below to proceed with login.
      - button "Continue" [ref=e14] [cursor=pointer]:
        - generic [ref=e15]: Continue
  - region "Notifications (F8)":
    - list
  - alert [ref=e16]: Rainyday Login
```