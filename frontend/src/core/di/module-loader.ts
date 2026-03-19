import { Container } from "inversify";
import type { ModuleRoute } from "@/core/router/types";
import { createAuthModule } from "@/modules/auth/di/container";
import { createHomeModule } from "@/modules/home/di/container";
import { createSystemModule } from "@/modules/system/di/container";
import { createPricingModule } from "@/modules/pages/pricing/di/container";
import { createErrorPagesModule } from "@/modules/pages/errors/di/container";
import { createPlaygroundModule } from "@/modules/playground/di/container";
import { createCryptoModule } from "@/modules/crypto/di/container";

/**
 * AppModule interface
 */
export interface AppModule {
  name: string;
  routes: ModuleRoute[];
  registerBindings?: () => void;
}

export interface ModuleRegistry {
  modules: Map<string, AppModule>;
  container: Container;
  registerModule: (module: AppModule) => void;
  getModule: (name: string) => AppModule | undefined;
  getAllRoutes: () => ModuleRoute[];
  getRouteBehavior: (
    pathname: string
  ) => import("@/shared/ui/layouts/behaviors").LayoutBehavior;
}

export function createModuleRegistry(container: Container): ModuleRegistry {
  const modules = new Map<string, AppModule>();
  const registerModule = (module: AppModule) => {
    modules.set(module.name, module);

    if (module.registerBindings) {
      module.registerBindings();
    }
  };

  const getModule = (name: string) => modules.get(name);
  const getAllRoutes = () =>
    Array.from(modules.values()).flatMap((m) => m.routes);

  /**
   * Find the layoutBehavior for a given pathname by matching against registered routes
   */
  const getRouteBehavior = (
    pathname: string
  ): import("@/shared/ui/layouts/behaviors").LayoutBehavior => {
    const allRoutes = getAllRoutes();

    // Helper to match a route path pattern against a pathname
    const matchRoute = (routePath: string, targetPath: string): boolean => {
      // Handle wildcard routes (e.g., /apps/chat/*)
      if (routePath.endsWith("/*")) {
        const basePath = routePath.slice(0, -2);
        return targetPath.startsWith(basePath);
      }

      // Handle dynamic segments (e.g., /users/:id)
      const routeParts = routePath.split("/");
      const pathParts = targetPath.split("/");

      if (routeParts.length !== pathParts.length) return false;

      return routeParts.every((part, i) => {
        if (part.startsWith(":")) return true; // Dynamic segment matches anything
        return part === pathParts[i];
      });
    };

    // Find matching route (check children recursively)
    const findBehavior = (
      routes: ModuleRoute[]
    ): import("@/shared/ui/layouts/behaviors").LayoutBehavior | null => {
      for (const route of routes) {
        if (matchRoute(route.path, pathname)) {
          return route.layoutBehavior ?? "default";
        }
        if (route.children) {
          const childBehavior = findBehavior(route.children);
          if (childBehavior) return childBehavior;
        }
      }
      return null;
    };

    return findBehavior(allRoutes) ?? "default";
  };

  return {
    modules,
    container,
    registerModule,
    getModule,
    getAllRoutes,
    getRouteBehavior,
  };
}

export function loadAllModules(container: Container): ModuleRegistry {
  const registry = createModuleRegistry(container);
  const modules = [
    createAuthModule,
    createHomeModule,

    // System Module
    createPricingModule,
    createErrorPagesModule,

    // System Module
    createSystemModule,
    createPlaygroundModule,

    // Crypto Module
    createCryptoModule,
  ];

  modules.map((fn) => fn(container)).forEach((m) => registry.registerModule(m));

  return registry;
}
