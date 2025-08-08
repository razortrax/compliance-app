This is an outline of pages content applied persistently and consistently throughout Compliance App. Use best practices throughout and minimize redundancy. Use CSS smartly for easy universal change of button, text, cards, etc styles.

Component definitions:

- Logo \- in header. static. Uses PNG logo file (`public/fleetrax-logo.png`) with direct img tags for reliable display across all pages
- Name \- in header. populate contextually as specified below. Aligned left with proper padding to right of Logo
- TopNav \- in header. populate contextually as specified below. Aligned left with proper padding to right of Name
- Account \- in header. account icon from clerk for managing logged in user. Aligned left.
- Greeting \- in header. “Hello “ \+ user first name with proper caps. no comma \+ short space and then role tag of logged in user MASTER, ORGANIZATION or LOCATION aligned right with proper margins and padding to left of Account.
- Master icon
- Organization icon
- Driver icon
- Equipment icon
- Selector buttons \- either of these two buttons may show or not show depending on context. If they display they are at the top of the sidebar menu.
  - Organization Selector \- this button and dropdown list already exists on pages when master user is invoked. It is a quick switch selector for master users. It’s current implementation is good. just needs to move to sidebar.
  - Driver/Equipment Selector \- if this button is to show it will be rectangular and fill the rest of the sidebar area if there is an Organization Selector button on the left or fill the whole sidebar area if there is not. Match height and style of the Organization Selector. Button icon/text display \= Driver icon \+ Equipment icon \+ “ Selector”. It will also dropdown or slideout two lists with a toggle switch
    - Drivers \- list of drivers in the organization or location
    - Equipment \- list of equipment in the organization or location

**Dashboard** \- If a person logs in as master they go to dashboard.

- Header
  - Logo
  - Name: Master name
  - Top nav is empty as there is nothing to select
  - Greeting
  - Account
- Name row \- not needed
- Content Area
  - KPIs \- counts across all managed organizations
    - Count of organizations
    - Count of drivers
    - Count of equipment
    - Count of expiring issues coming due in 30 days or expired
    - Count of open Roadside Inspection issues
    - Count of open accident issues
  - Tabs
    - Organizations \- list of organizations
    - Staff \- list of Master staff

**Master \> Organization** \- master clicks on organization card and navigates to organization page with master context:

- Header
  - Logo
  - Name: Master name
  - Top navigation
    - Master \- nav to dashboard
    - Organization \- nav to organization page
    - Drivers \- nav to drivers page which is a list of all org drivers
    - Equipment \- nav to equipment page which is list of all org equipment
    - Settings
  - Greeting
  - Account
- Name row
  - Name of selected organization \- aligned left
  - Edit button \- aligned right
  - Reports button \- to left of Edit button
- Sidebar menu \- aligned left
  - Selector buttons at top of sidebar menu
    - Organization Selector
    - Driver/Equipment Selector \- default to driver list unless user is in equipment related pages. In that case default to equipment list
  - Sidebar Menu Organization- shown in all Organization pages
    - Overview \- nav to organization
    - Issues \- nav to list of expiring issues coming due in 60 days and open Roadside Inspections or accidents
    - Roadside Inspections \- nav to roadside inspection_issue
    - Accidents \- nav to accident_issue
    - Audits \- nav to audit
    - Preferences \- Need to decide if preferences needs to exist of if org preferences are handled in Settings.
  - Sidebar Menu Equipment \- shown in all Drivers pages
    - Overview \- nav to organization
    - Licenses \- nav to license_issue
    - MVRs \- nav to mvr_issue
    - Drug & Alcohol \- nav to drugalcohol_issue
    - Physicals \- nav to physical_issue
    - Training \- nav to training_issue
    - Roadside Inspections \- nav to roadsideinspection_issue
    - Accidents \- nav to accident_issue
  - Sidebar Menu Equipment \- shown in all Equipment page
    - Overview \- nav to organization
    - Registrations \- nav to registration_issue
    - Annual Inspections \- nav to annualinspection_issue
    - Maintenance \- nav to maintenance_issue
    - Roadside Inspections \- nav to roadsideinspection_issue
    - Accidents \- nav to accident_issue
  - Content Area **Organization**
    - KPIs \- counts across all managed organizations
      - Count of organization drivers
      - Count of organization equipment
      - Count of organization expiring issues coming due in 30 days or expired
      - Count of organization open Roadside Inspection issues
      - Count of organization open accident issues
    - Tabs
      - Details
      - Locations \- list of Organization Locations
      - Staff \- list of Organization Staff
  - Content Area **Driver**
    - KPIs \- only show if count \> 0
      - Count of driver issues expiring in 60 days
      - Count of driver issues expiring in 30 days
      - Count of open driver Roadside Inspection issues
      - Count of open driver accident issues
    - Driver Overview page
      - Tabs
        - Driver details
          - Phone \- list of phones
          - Email \- list of email
          - Address \- list of address
        - Relationships \- list of relationships in party model. may include spouse, daughter, son, preacher, friend, doctor, lawyer, etc. Include contact info.
    - Selected Driver Issue pages \- if user selects an issue from sidebar the specific issue records and details are displayed
      - Master Detail List \- list of all the issue records for that specific issue type including active and expired.
      - Master Detail Details \- details of the selected issue
  - Content Area **Equipment**
    - KPIs \- only show if count \> 0
      - Count of equipment issues expiring in 60 days
      - Count of equipment issues expiring in 30 days
      - Count of open equipment Roadside Inspection issues
      - Count of open equipment accident issues
    - Equipment Overview page
      - Tabs
        - Equipment details
          - Phone \- list of phones
          - Email \- list of email
          - Address \- list of address
        - Relationships \- list of relationships in party model. may include spouse, daughter, son, preacher, friend, doctor, lawyer, etc. Include contact info.
    - Selected Equipment Issue pages \- if user selects an issue from sidebar the specific issue details are displayed
      - Master Detail List \- list of all the issue records for that specific issue type including active and expired.
      - Master Detail Details \- details of the selected issue

When logged in as O**rganization** (note: org shows all drivers and equipment from all locations). Here we will only note the change from the Master outline above

- Header
  - Name: do not show
  - Top navigation
    - Master \- do not show
- Sidebar menu \- aligned left
  - Selector buttons at top of sidebar menu
    - Master Selector- do not show
    - Driver/Equipment Selector \- stretch across all sidebar menu section

When logged in as **Location**

Note: Location role is setup by organization user not signup process. Role is create by adding staff role person and then assigning them a location role and making them a user.

Here we will only note the changes from the Master outline above

- Header
  - Name: do not show
  - Top navigation
    - Master \- do not show
    - Organization \- do not show
    - Location \- add, replaces Organization, nav to Location page
- Sidebar menu \- aligned left
  - Selector buttons at top of sidebar menu
    - Master Selector- do not show
    - Driver/Equipment Selector \- stretch across all sidebar menu section
