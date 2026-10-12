import { createContext } from "react";

// Separate file so AuthContext can be imported by both AuthProvider and useAuth
// without triggering the react-refresh/only-export-components rule.
const AuthContext = createContext(null);

export default AuthContext;