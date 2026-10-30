// ============================================
// CLERK AUTHENTICATION
// ============================================

window.clerkState = {
  isSignedIn: false,
  user: null,
  token: null
};

/**
 * Handle Clerk authentication (sign in/out)
 */
window.handleClerkAuth = async function() {
  if (!window.Clerk) {
    alert('Clerk SDK is not loaded. Please check your internet connection.');
    return;
  }

  const clerk = window.Clerk;

  try {
    if (clerk.user) {
      await clerk.signOut();
      window.location.reload();
    } else {
      // openSignIn is available on the auto-initialized Clerk instance
      await clerk.openSignIn();
    }
  } catch (error) {
    console.error('Clerk authentication error:', error);
    alert('Authentication error. Please check your console.');
  }
};

/**
 * Update Clerk UI based on auth state
 */
function updateClerkUI() {
  const button = document.getElementById('clerkSignInBtn');
  const buttonText = document.getElementById('clerkButtonText');
  const userInfo = document.getElementById('clerkUserInfo');
  const clerk = window.Clerk;

  const isSignedIn = clerk && clerk.user;
  window.clerkState.isSignedIn = !!isSignedIn;
  window.clerkState.user = clerk ? clerk.user : null;

  if (button && buttonText) {
    if (isSignedIn && clerk.user) {
      buttonText.textContent = 'Sign Out';
      if (userInfo) {
        userInfo.textContent = `Signed in as: ${clerk.user.primaryEmailAddress?.emailAddress || 'User'}`;
        userInfo.style.display = 'block';
      }
    } else {
      buttonText.textContent = 'Sign In / Sign Up';
      if (userInfo) {
        userInfo.textContent = '';
        userInfo.style.display = 'none';
      }
    }
  }
}

/**
 * Initialize Clerk authentication
 */
async function initClerk() {
  try {
    // Poll for window.Clerk to be ready from CDN
    let retries = 0;
    while (!window.Clerk && retries < 30) {
      await new Promise(res => setTimeout(res, 100));
      retries++;
    }

    if (!window.Clerk) {
      console.warn('Clerk script not loaded.');
      return;
    }

    const clerk = window.Clerk;

    // DO NOT call clerk.load() manually if using data-clerk-publishable-key attribute in HTML!
    // Simply wait for Clerk to be loaded by the CDN script:
    if (!clerk.isReady()) {
      await clerk.load();
    }

    console.log('Clerk SDK ready');

    updateClerkUI();

    clerk.addListener(({ user, session }) => {
      window.clerkState.isSignedIn = !!user;
      window.clerkState.user = user || null;
      window.clerkState.token = session?.token || null;
      updateClerkUI();
    });

  } catch (error) {
    console.error('Failed to initialize Clerk:', error);
  }
}
