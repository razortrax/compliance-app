Corrective Action Process

Can’t tell by looking at the CAF how exactly it is being processed. Here are my ideas: First a CAF is driven by violiations. So each violation is evaluated based on the code.

* User receives DVER or finds it during weekly check of FMCSA portal.  
* User creates a RINS in Fleetrax  
* User selects Generate CAF button in the selected RINS page and Fleetrax creates at least one CAF. Need to determine best way to display a master detail display for managing more than one CAF when necessary.  
* User determines who should receive the CAF(s)  
  * Codes starting with 390 are organization related.  
    * All of these codes will have their own CAF.  
    * We need to add a field in org \> staff role to designate the staff person that should receive org CAFs.  
    * User administering a CAF can change (or select in case the org CAF staff is not identified) the staff receiving the CAF with a dropdown of all org \> staff.  
  * Codes starting with 391 are driver qualification issues. 392 are driver performance issues.  
    * All of these codes will have their own CAF.  
    * We need to add a field in org \> driver role to designate the staff person that is the driver supervisor and should receive CAFs for the driver.  
    * User administering a CAF can change (or select in case the driver CAF staff is not identified) the staff receiving the CAF with a dropdown of all org \> staff.  
  * Codes starting with 393 and 396 are equipment related.  
    * All of these codes will have their own CAF.  
    * The RINS \> violation selector has a field to select which equipment the violation applies if there is more than one equipment. (Ideally if there is only one equipment it is auto-selected). The violation’s selected equipment should be noted on the CAF.  
    * Driver should also be noted in case maintenance needs to contact the driver with questions.  
    * We need to add a field in org \> equipment role to designate the staff person that is the maintenance supervisor over that equipment and should receive CAFs for the equipment.  
    * User administering a CAF can change (or select in case the equipment CAF staff is not identified) the staff receiving the CAF with a dropdown of all org \> staff.  
* User adds correct action requirements for each cited violation. In a later development Fleetrax will make and AI API call to fill this information.  
* User clicks create button and the PDFs are created.  
* Somehow the pdf document(s) should have final reviewed by user and then submitted to the designated CAF staff person via email.  
* CAF staff person receives the pdf CAF and takes required actions  
* CAF staff person attaches proof documents if neeeded, digitally signs pdf and returns to CAF staff person  
* User receives and reviews the returned documents  
  * Approves and does final processing/logging as you suggest.  
  * Determines further action is required and starts manual process to address this (can be codified if we get a better idea about how this process works) until it can finally be approved. Currently these further action steps can be logged in the Addon section.  
  * In a later dev maybe the returned form are automatically logged into the RSIN  
* User approves and closes the RSIN.

The current CAF form is a good start but much of it needs to be editable with another process step and a list of PDFs.