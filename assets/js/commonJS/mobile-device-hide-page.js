  // js/global.js

        function checkDeviceAndRedirect() {
            // Standard tablet/mobile breakpoint is usually 1024px
            const isMobileOrTablet = window.innerWidth <= 1023;

            if (isMobileOrTablet) {
                // Redirect to the home index page
                window.location.href = "../../index.html";
            }
        }

        // Run the check on page load
        checkDeviceAndRedirect();

        // Optional: Run the check if the user resizes their window
        window.addEventListener('resize', checkDeviceAndRedirect);