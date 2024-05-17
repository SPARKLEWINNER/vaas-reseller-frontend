describe('wallet unit tests', () => {
    beforeEach(() => {
        const isStaging = Cypress.env('IsStaging');
        cy.visit(`${Cypress.env(isStaging ? 'REACT_CYPRESS_STAGING_TEST_URL' : 'REACT_CYPRESS_LOCAL_TEST_URL')}/login`); // Adjust if your local development URL is different
        cy.get('input[name="email"]').type('test891554@yopmail.com');
        cy.get('input[name="password"]').type('Tonyspark@71');
        cy.contains('button', 'Login').click().wait(3000);
        cy.get('[name="navMenu"]').click();
        cy.contains('a div', 'Wallets & Payouts').click();
    })

    it('Check wallet elements visible', () => {
        cy.url().should('include', '/dashboard/wallet');
        cy.contains('h4', 'Wallet and Payout').should('be.visible');
        cy.contains('div label', 'Amount to be credited in your Wallet');
    })

    it('Test wallet bank replenishment', () => {
        cy.contains('div label', 'Amount to be credited in your Wallet')
            .parent('div') // Assuming the input is a sibling of the label inside the same div
            .find('input')
            .type('50');
        cy.contains('button', 'Next').click();
        cy.contains('div span', 'Bank Deposit').click();
        cy.contains('div label', 'Browse')
            .click()
            .selectFile('cypress/fixtures/test-bank-receipt.png');
        cy.contains('button', 'Submit').click();
        cy.contains('div button', 'Submitting...').should('be.visible').wait(22000);
        cy.contains('p span','Please wait for your replenishment request to be processed.').should('be.visible');
        cy.contains('button','Done').click();
        cy.contains('button', 'History').should('have.attr', 'aria-selected', 'true');
    })

    // todo wallet replenishment report batch 2
    // it('Test View History', () => {
    //     cy.contains('button', 'History').click();
    //     cy.get('[class="rdrDateRangePickerWrapper"]').should('be.visible');
    // cy.get('input[placeholder="Early"]').then($input => {
    //     // Use jQuery to set the value of the input directly
    //     $input.val('March 1, 2024');
    // });
    // cy.get('input[placeholder="Early"]').then($input => {
    //     // Use jQuery to set the value of the input directly
    //     $input.val('March 1, 2024');
    // });
    // })
})