describe('Sign Up Page Tests', () => {
    const now = new Date().getTime();
    const unixTimestamp = Math.floor(now / 1000);
    const tempEmail = `testuser${unixTimestamp}@example.com`;

    beforeEach(() => {
        // Runs before each test in the block
        const isStaging = Cypress.env('IsStaging');
        cy.visit(`${Cypress.env(isStaging ? 'REACT_CYPRESS_STAGING_TEST_URL' : 'REACT_CYPRESS_LOCAL_TEST_URL')}/signup`); // Adjust if your local development URL is different
    });

    it('Check sign up elements are visible', () => {
        cy.url().should('include', '/signup');
        cy.get('input[name="firstName"]').should('exist');
        cy.get('input[name="middleName"]').should('exist');
        cy.get('input[name="lastName"]').should('exist');
        cy.get('input[name="email"]').should('exist');
        cy.get('input[name="mobileNumber"]').should('exist');
        cy.get('input[name="username"]').should('exist');
        cy.get('input[name="password"]').should('exist');
        cy.get('input[name="confirmPassword"]').should('exist');
    })

    it('Test sign up validation', () => {
        cy.wait(3000);
        cy.get('[name="firstName"]').type('test<>');
        cy.get('[name="middleName"]').type('testng<>');
        cy.get('[name="lastName"]').type('tester<>');
        cy.get('input[name="email"]').type(`${tempEmail}<>>>>>>`);
        cy.get('input[name="mobileNumber"]').type('9513217169<>');
        cy.contains('div p', 'First Name contains invalid characters').should('exist');
        cy.contains('div p', 'Middle Name contains invalid characters').should('exist');
        cy.contains('div p', 'Last Name contains invalid characters').should('exist');
        cy.contains('div p', "Wrong Number format. Please use only digits and optional '+'.").should('exist');
        cy.contains('div p', 'Invalid email format').should('exist');
    })

    it('test signup tickboxes ', () => {
        cy.wait(3000);
        cy.get('input[name="termsCheck"]').click();
        cy.get('.termsScroll').scrollTo('bottom');
        cy.contains('button', 'Agree to Terms').click();
        cy.get('input[name="termsCheck"]').should('be.checked');
        cy.get('input[name="privacyCheck"]').click();
        cy.get('.privacyScroll').scrollTo('bottom');
        cy.contains('button', 'Agree to Terms').click();
        cy.get('input[name="privacyCheck"]').should('be.checked');
        cy.get('input[name="cookieCheck"]').click();
        cy.get('.cookieScroll').scrollTo('bottom'); // Scroll 'sidebar' to its bottom
        cy.contains('button', 'Agree to Terms').click();
        cy.get('input[name="cookieCheck"]').should('be.checked');
        cy.get('input[name="termsCheck"]').click();
        cy.get('input[name="termsCheck"]').should('not.be.checked');
        cy.get('input[name="privacyCheck"]').click();
        cy.get('input[name="privacyCheck"]').should('not.be.checked');
        cy.get('input[name="cookieCheck"]').click();
        cy.get('input[name="cookieCheck"]').should('not.be.checked');
    })

    it('Check sign up functionality', () => {
        const isTestEnv = Cypress.env('IS_TEST_ENV');

        if (isTestEnv) {
            // Mock the OTP verification API in test environment
            cy.intercept('POST', '**/verify', {
                statusCode: 200,
                body: { success: true },
            }).as('mockOtp');
        }

        cy.wait(4000);
        cy.get('[name="firstName"]').type('test');
        cy.get('[name="lastName"]').type('tester');
        if(isTestEnv){
            cy.get('input[name="email"]').type(tempEmail);
        }else{
            cy.pause();
        }
        cy.get('input[name="mobileNumber"]').type('9513217169');
        cy.get('input[name="password"]').type('Tonyspark@71');
        cy.get('input[name="confirmPassword"]').type('Tonyspark@71');
        cy.get('input[name="termsCheck"]').click();
        cy.get('.termsScroll').scrollTo('bottom');
        cy.contains('button', 'Agree to Terms').click();
        cy.get('input[name="privacyCheck"]').click();
        cy.get('.privacyScroll').scrollTo('bottom');
        cy.contains('button', 'Agree to Terms').click();
        cy.get('input[name="cookieCheck"]').click();
        cy.get('.cookieScroll').scrollTo('bottom'); // Scroll 'sidebar' to its bottom
        cy.contains('button', 'Agree to Terms').click();
        cy.get('button[name="signup"]').click();
        cy.contains('Signing up...').should('be.visible').wait(2000);
        cy.contains('Successful Sign-Up!').should('be.visible');
        cy.wait(2000);
        if(isTestEnv){
            cy.get('[name="inputVerifyCode"]').type('123456');
        }else{
            cy.pause();
        }
        cy.contains('Verify').click();
        cy.contains('Success').should('be.visible');
        cy.url().should('include', '/login');
        if(isTestEnv) {
            cy.get('input[name="email"]').type(tempEmail);
        }else{
            cy.pause();
        }
        cy.get('input[name="password"]').type('Tonyspark@71');
        cy.contains('button', 'Login').click();
        cy.url().should('include', '/dashboard/app');
    })

    it('Test Login redirection', () => {
        cy.contains('Login').click();
        cy.url().should('include', '/login');
        cy.contains('h6', 'Login').should('be.visible');
    })

    // todo sign up unit test with working generated email
    // it('Check sign up functionality', () => {
    //     cy.mailslurp({apiKey: '2959d35a56fe2a37c56023b4f80ff31d2a7297a78c8b057de04db6c713988826'}).then((mailslurp) => {
    //         // create an email address and store it on this
    //         cy.then(() => mailslurp.createInbox())
    //             .then((inbox) => {
    //                 // save inbox id and email address to this
    //                 cy.wait(5000);
    //                 cy.get('[name="firstName"]').type('test');
    //                 cy.get('[name="lastName"]').type('tester');
    //                 cy.get('input[name="email"]').type(inbox.emailAddress);
    //                 cy.get('input[name="mobileNumber"]').type('9513217169');
    //                 cy.get('input[name="password"]').type('Tonyspark@71');
    //                 cy.get('input[name="confirmPassword"]').type('Tonyspark@71');
    //                 cy.get('input[name="termsCheck"]').click();
    //                 cy.get('.termsScroll').scrollTo('bottom'); // Scroll 'sidebar' to its bottom
    //                 cy.contains('button', 'Agree to Terms').click();
    //                 cy.get('button[name="signup"]').click();
    //             })
    //     });
    // })

});