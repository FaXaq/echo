# Authentication


## Permissions

We use a RBAC like system that allows to define roles and permissions for users.
It's based on the [better-auth](https://github.com/epicweb-dev/better-auth) library.

They are two levels of permissions:
- Through the admin plugin for system wide permissions.
- Through the organization plugin for organization specific permissions.

### Admin

This is where the separation between users from Echo & users from other organizations.

#### How to check if user has permission ?

Server based : 
```ts
await auth.api.userHasPermission({
  body: {
    userId: 'id', //the user id
    permissions: {
      project: ["create"], // This must match the structure in your access control
    },
  },
});

// You can also just pass the role directly
await auth.api.userHasPermission({
  body: {
   role: "admin",
    permissions: {
      project: ["create"], // This must match the structure in your access control
    },
  },
});

// You can also check multiple resource permissions at the same time
await auth.api.userHasPermission({
  body: {
   role: "admin",
    permissions: {
      project: ["create"], // This must match the structure in your access control
      sale: ["create"]
    },
  },
});
```

Client based :

```ts
const canCreateProject = await authClient.organization.hasPermission({
  permissions: {
    project: ["create"],
  },
});

// You can also check multiple resource permissions at the same time
const canCreateProjectAndCreateSale =
  await authClient.organization.hasPermission({
    permissions: {
      project: ["create"],
      sale: ["create"],
    },
  });
```
### Organization
