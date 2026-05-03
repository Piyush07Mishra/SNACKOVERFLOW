# Dynamic Page Titles Implementation

## 🎯 Overview

Dynamic page titles have been implemented to provide context-aware titles that update based on the current page, user context, and content being viewed. This improves user experience and SEO by providing more specific and relevant page titles.

## 📋 Implementation Details

### **1. Core Components**

#### **Page Title Utility** (`/lib/getPageTitle.ts`)
- **getPageTitle()**: Gets title configuration based on pathname
- **generateMetadata()**: Generates Next.js metadata objects
- **generateDynamicTitle()**: Creates titles with user context
- **getBasePageTitle()**: Extracts base title without suffix

#### **Dynamic Page Title Component** (`/components/DynamicPageTitle.tsx`)
- Client-side component that updates document.title
- Supports user context (name, employee ID, department)
- Handles dynamic routes and custom titles
- Uses useEffect to update title on route changes

### **2. Page Title Configurations**

All major pages have predefined title configurations:

```typescript
const pageTitles = {
  '/dashboard': {
    title: 'Dashboard - EmPay',
    description: 'HR Dashboard Overview and Analytics'
  },
  '/dashboard/attendance': {
    title: 'Attendance - EmPay',
    description: 'Manage employee attendance and time tracking'
  },
  '/dashboard/profile': {
    title: 'Profile - EmPay',
    description: 'Manage your profile and personal information'
  },
  // ... more pages
}
```

### **3. Dynamic Title Features**

#### **User Context Integration**
- **Profile Pages**: Shows "Profile: John Doe - EmPay" or "John Doe's Profile - EmPay"
- **Admin Views**: Shows context when viewing other users' profiles
- **Department Views**: Includes department name when applicable

#### **Custom Title Support**
- **Dashboard**: "Dashboard Overview - EmPay"
- **Custom Pages**: Can override default titles with custom text
- **Context-Aware**: Changes based on user role and permissions

#### **Route-Based Titles**
- **Static Routes**: Predefined titles for fixed pages
- **Dynamic Routes**: Pattern matching for dynamic URLs
- **Fallback**: Default title for unknown routes

## 🔧 Usage Examples

### **Basic Implementation**

```tsx
import { DynamicPageTitle } from "@/components/DynamicPageTitle";

export default function SomePage() {
  return (
    <>
      <DynamicPageTitle customTitle="Custom Page Title" />
      {/* Page content */}
    </>
  );
}
```

### **User Context Implementation**

```tsx
export default function ProfilePage({ user }) {
  return (
    <>
      <DynamicPageTitle 
        userName={user.name}
        employeeId={user.employeeId}
        customTitle={isOtherUser ? `${user.name}'s Profile` : `Profile: ${user.name}`}
      />
      {/* Profile content */}
    </>
  );
}
```

### **Department Context**

```tsx
export default function DepartmentPage({ department }) {
  return (
    <>
      <DynamicPageTitle 
        department={department.name}
        customTitle={`${department.name} Department`}
      />
      {/* Department content */}
    </>
  );
}
```

## 📱 **Pages Updated**

### **1. Profile Page** (`/app/dashboard/profile/page.tsx`)
- **Dynamic Titles**: 
  - Own profile: "Profile: John Doe - EmPay"
  - Other user's profile: "John Doe's Profile - EmPay"
  - Fallback: "Profile - EmPay"
- **Context**: User name, employee ID, viewing permissions

### **2. Dashboard Page** (`/app/dashboard/page.tsx`)
- **Title**: "Dashboard Overview - EmPay"
- **Context**: Admin/HR role-based content

### **3. Future Pages to Update**
- Attendance page with date context
- Payroll page with month context
- Leave page with request status
- Directory page with search context

## 🎨 **Title Patterns**

### **Standard Pattern**
```
[Page Name] - EmPay
```

### **User Context Pattern**
```
[Page Name]: [User Name] - EmPay
```

### **Custom Pattern**
```
[Custom Title] - EmPay
```

### **Department Pattern**
```
[Page Name] - [Department Name] - EmPay
```

## 🔍 **Technical Implementation**

### **Client-Side Updates**
- Uses `useEffect` to update `document.title`
- Responds to route changes via `usePathname`
- No server-side rendering impact

### **SEO Benefits**
- Dynamic titles improve search relevance
- Better user experience in browser tabs
- Context-aware for bookmarking

### **Performance**
- Lightweight component with minimal overhead
- No additional API calls required
- Efficient route-based updates

## 🚀 **Advanced Features**

### **1. Metadata Generation**
```typescript
export async function generateMetadata({ params }): Promise<Metadata> {
  const title = generateDynamicTitle(pathname, { userName: user.name });
  return {
    title,
    description: `Custom description for ${title}`,
    openGraph: {
      title,
      description: `OG description for ${title}`,
    },
  };
}
```

### **2. Breadcrumb Integration**
```tsx
const breadcrumbs = [
  { label: 'Home', href: '/' },
  { label: baseTitle, href: pathname },
  { label: userName, href: pathname } // Only if user context
];
```

### **3. Analytics Integration**
```typescript
useEffect(() => {
  // Track page view with dynamic title
  analytics.track('page_view', {
    title: document.title,
    path: pathname,
    userContext: { userName, department }
  });
}, [pathname, userName]);
```

## 📊 **Title Hierarchy**

1. **Custom Title** (highest priority)
2. **User Context Title**
3. **Route-Based Title**
4. **Default Title** (fallback)

## 🔧 **Configuration**

### **Adding New Pages**
```typescript
// In /lib/getPageTitle.ts
const pageTitles = {
  '/new-page': {
    title: 'New Page - EmPay',
    description: 'Description for new page'
  }
};
```

### **Custom Title Patterns**
```typescript
// In component
<DynamicPageTitle 
  customTitle={`${action} ${entityType}`}
  userName={user.name}
/>
```

## 🎯 **Best Practices**

1. **Keep Titles Concise**: Aim for 50-60 characters
2. **Include Context**: User names, dates, departments when relevant
3. **Maintain Branding**: Always include "- EmPay" suffix
4. **Use Action Words**: "Manage", "View", "Edit" when appropriate
5. **Consider SEO**: Include relevant keywords naturally

## 🔄 **Future Enhancements**

1. **Real-time Updates**: Update titles based on live data
2. **Multi-language Support**: Localized titles
3. **A/B Testing**: Test different title patterns
4. **User Preferences**: Allow custom title preferences
5. **Integration with Search**: Enhanced search result titles

---

This dynamic title system provides a flexible foundation for context-aware page titles that enhance user experience and SEO across the EmPay HRMS platform.
