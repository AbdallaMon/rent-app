"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { Failed, Success } from "@/components/loading/ToastUpdate";
import { pathMap } from "@/helpers/functions/getUserPrivilege";

export const AuthContext = createContext(null);

export default function AuthProvider({ children }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState({});
  const [redirect, setRedirect] = useState(false);
  const router = useRouter();
  let pathName = usePathname();
  const [checkAccess, setCheckAccess] = useState(false);

  useEffect(() => {
    async function auth() {
      setCheckAccess(true);
      const isPublicPage =
        pathName === "/reset-password" ||
        pathName === "/forgot-password" ||
        pathName === "/login";

      const toastId = isPublicPage
        ? null
        : toast.loading("يتم التحقق من الصلاحيات...");

      const response = await fetch(`/api/auth/state`, { cache: "no-store" });
      const result = await response.json();

      if (result.auth === false) {
        if (isPublicPage) {
          return;
        }
        window.localStorage.setItem("redirect", window.location.pathname);

        router.push("/login");
        if (toastId) {
          toast.update(toastId, Failed("غير مصرح"));
        }

        setIsLoggedIn(false);
        setUser({});
      } else {
        if (toastId) {
          toast.update(
            toastId,
            Success("مصرح. جاري تحميل البيانات الرجاء الانتظار...")
          );
        }

        setIsLoggedIn(result.auth);
        setUser(result.user);
      }
    }
    auth();
  }, [redirect]);

  useEffect(() => {
    if (isLoggedIn && user) {
      const checkAccess = () => {
        setCheckAccess(true);
        const userPrivileges = user.privileges.reduce((acc, priv) => {
          acc[priv.area] = priv.privilege;
          return acc;
        }, {});

        if (pathName.split("/").length > 2) {
          pathName = "/" + pathName.split("/")[1];
        }

        let area = Object.keys(pathMap).find((key) => pathName.includes(key))
          ? pathMap[Object.keys(pathMap).find((key) => pathName == key)]
          : null;

        setCheckAccess(false);

        if (pathName === "/" || pathName === "/login" || pathName === "") {
          area = "HOME";
        }

        if (area && userPrivileges[area]?.canRead) {
          if (window.location.pathname !== "/login") {
            window.localStorage.setItem("redirect", window.location.pathname);
          }
          return true;
        } else {
          router.push("/not-allowed");
        }

        return false;
      };

      checkAccess();
    } else {
      setCheckAccess(false);
    }
  }, [isLoggedIn, pathName, user?.privileges, user]);

  const renderContent = () => {
    if (!isLoggedIn) {
      if (
        pathName === "/reset-password" ||
        pathName === "/forgot-password" ||
        pathName === "/login"
      ) {
        return children;
      }
      return null;
    } else {
      return !checkAccess ? children : null;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        setRedirect,
        redirect,
        user,
        setUser,
        isLoggedIn,
        setIsLoggedIn,
      }}
    >
      {renderContent()}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  return context;
};
