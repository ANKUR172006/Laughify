import { Outlet, useLocation } from "react-router-dom";
import Scene3D from "./features/shared/components/Scene3D";

export default function RootLayout() {
  const location = useLocation();
  const show3DScene = !["/login", "/register", "/game"].includes(location.pathname);

  return (
    <>
      {show3DScene && <Scene3D />}
      <Outlet />
    </>
  );
}
