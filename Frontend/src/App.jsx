import { RouterProvider } from "react-router-dom";
import { router } from "./app.routes";
import "./features/shared/global.scss";
import CustomCursor from "./features/shared/components/CustomCursor";

function App() {
  return (
    <>
      <CustomCursor />
      <RouterProvider router={router} />
    </>
  );
}

export default App;