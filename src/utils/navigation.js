/**
 * Navigation utility functions for consistent page navigation
 */

// Navigate to a page using the setCurrentPage function
export const navigateTo = (setCurrentPage, page) => {
  if (typeof setCurrentPage !== 'function') {
    console.error('navigateTo: setCurrentPage is not a function');
    return;
  }

  console.log(`Navigating to: ${page}`);
  setCurrentPage(page);
};

// Navigate to home page
export const navigateToHome = (setCurrentPage) => {
  navigateTo(setCurrentPage, 'home');
};

// Navigate based on user role
export const navigateAfterLogin = (setCurrentPage, user, isAdmin, isClub) => {
  if (isAdmin) {
    navigateTo(setCurrentPage, 'admin-dashboard');
  } else if (isClub) {
    navigateTo(setCurrentPage, 'club-dashboard');
  } else {
    navigateToHome(setCurrentPage);
  }
};

// Hard refresh the page (for logout and other cases where state needs to be completely reset)
export const hardRefresh = () => {
  window.location.href = '/';
};

// Logout and redirect
export const logoutAndRedirect = async (signOutFn) => {
  try {
    if (typeof signOutFn === 'function') {
      await signOutFn();
    }

    // Add a small delay to ensure state updates are processed
    setTimeout(() => {
      // Force a complete page refresh to clear all state
      hardRefresh();
    }, 100);
  } catch (error) {
    console.error('Error during logout:', error);
    // Even if there's an error, still redirect to home
    hardRefresh();
  }
};
