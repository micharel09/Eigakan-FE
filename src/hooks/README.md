# Custom Hooks

This directory contains custom React hooks for common functionality used throughout the application. These hooks help improve code reusability, maintainability, and organization by extracting common logic into reusable functions.

## Available Hooks

### `useAuth`

Manages authentication state and user information.

```jsx
import { useAuth } from "../hooks";

function Component() {
  const {
    user, // Current user object
    token, // Authentication token
    role, // User role
    isAuthenticated, // Boolean indicating if user is authenticated
    isAdmin, // Boolean indicating if user is an admin
    isManager, // Boolean indicating if user is a manager
    isPublisher, // Boolean indicating if user is a publisher
    isAdvertiser, // Boolean indicating if user is an advertiser
    isVipMember, // Boolean indicating if user is a VIP member
    isMember, // Boolean indicating if user is a regular member
    handleLogout, // Function to log out user
    hasRole, // Function to check if user has a specific role
    hasAnyRole, // Function to check if user has any of the provided roles
  } = useAuth();

  // Example usage:
  if (!isAuthenticated) {
    return <div>Please log in</div>;
  }

  if (isAdmin || isManager) {
    return <AdminPanel />;
  }

  return (
    <div>
      <h1>Welcome, {user.fullName}</h1>
      <button onClick={handleLogout}>Log out</button>
    </div>
  );
}
```

### `useScrollEffect`

Handles scroll-related effects and optimizes scroll event listeners.

```jsx
import { useScrollEffect } from "../hooks";

function Component() {
  // Get isScrolled status when page is scrolled more than 50px
  const { isScrolled, scrollY } = useScrollEffect(50);

  // You can also pass a callback to execute when threshold is crossed
  useScrollEffect(100, (hasScrolledPastThreshold, currentScrollY) => {
    console.log(`Scrolled past 100px: ${hasScrolledPastThreshold}`);
    console.log(`Current scroll position: ${currentScrollY}px`);
  });

  return (
    <header className={`navbar ${isScrolled ? "navbar-scrolled" : ""}`}>
      {/* Your navbar content */}
    </header>
  );
}
```

### `useModal`

Manages modal state with animation support and handles common modal behavior like escape key closing.

```jsx
import { useModal } from "../hooks";

function Component() {
  // Set initial state (default: false), optional close callback, and animation duration
  const {
    isVisible, // Boolean indicating if modal is visible
    isAnimating, // Boolean indicating if modal is currently animating
    open, // Function to open the modal
    close, // Function to close the modal
    toggle, // Function to toggle the modal state
  } = useModal(false, () => console.log("Modal closed"), 300);

  return (
    <>
      <button onClick={open}>Open Modal</button>

      {isVisible && (
        <div className={`modal ${isAnimating ? "animating" : ""}`}>
          <div className="modal-content">
            <h2>Modal Title</h2>
            <p>Modal content goes here</p>
            <button onClick={close}>Close</button>
          </div>
        </div>
      )}
    </>
  );
}
```

### `usePath`

Provides utilities for checking active routes and path matching.

```jsx
import { usePath } from "../hooks";

function Component() {
  const {
    currentPath, // Current path string
    isInPath, // Function to check if path is included in current path
    isExactPath, // Function to check if current path exactly matches path
    pathStartsWith, // Function to check if current path starts with prefix
    matchesAnyPrefix, // Function to check if path matches any prefix in list
    extractParams, // Function to extract dynamic route parameters
    searchParams, // URLSearchParams object for the current location
  } = usePath();

  // Example usage:
  const isActive = isInPath("/dashboard");
  const isHomePage = isExactPath("/");
  const isAdminSection = pathStartsWith("/admin");

  // Check if path matches any of these prefixes
  const isRestrictedArea = matchesAnyPrefix([
    "/admin",
    "/manager",
    "/publisher",
  ]);

  // Extract route parameters
  const params = extractParams("/user/:id", "/user/123"); // Returns { id: '123' }

  // Access search params
  const query = searchParams.get("search");

  return (
    <nav>
      <a className={isHomePage ? "active" : ""} href="/">
        Home
      </a>
      <a className={isAdminSection ? "active" : ""} href="/admin">
        Admin
      </a>
    </nav>
  );
}
```

## Best Practices

1. **Always import hooks from the index file**:

   ```jsx
   import { useAuth, useScrollEffect } from "../hooks";
   ```

2. **Use destructuring to get only what you need**:

   ```jsx
   const { user, isAdmin } = useAuth();
   ```

3. **Custom hooks should be used inside functional components or other custom hooks**:

   ```jsx
   function MyComponent() {
     const { isScrolled } = useScrollEffect(10);
     // ...
   }
   ```

4. **Follow the 'use' naming convention for all custom hooks**

5. **Consider performance implications**:
   - All our hooks use memoization internally to prevent unnecessary recalculations
   - Be mindful of hook dependencies and provide only what's needed
