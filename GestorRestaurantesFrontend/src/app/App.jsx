import { AppRoutes } from "./router/AppRoutes"
import { Toaster } from "react-hot-toast"

export const App = () => {
  return (
    <>
      <Toaster 
        position="top-center"
        toastOptions={{
          style: {
            fontFamily: "inherit",
            fontWeight: "600",
            fontSize: "1rem",
            borderRadius: "8px"
          }
        }}
      />
      <AppRoutes />
    </>
  )
}
