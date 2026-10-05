import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Eye, EyeOff, Mail, Lock, Dumbbell } from "lucide-react";
import useAuth from "../../hooks/useAuth";
import { roleHome } from "../../utils/roles";
import { staggerContainer, staggerItem, scaleIn } from "../../utils/motion";

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await login(form);
      const role = response?.user?.role;

      if (!role) {
        setError("Invalid user role.");
        return;
      }

      navigate(roleHome(role));
    } catch (err) {
      setError(
        err.response?.data?.message || "Invalid email or password."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-background">
        <motion.div
          className="glow glow-one"
          animate={{ x: [0, 30, 0], y: [0, 20, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="glow glow-two"
          animate={{ x: [0, -25, 0], y: [0, -15, 0] }}
          transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="glow glow-three"
          animate={{ scale: [1, 1.15, 1] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
        <div className="background-grid" />
      </div>

      <motion.div
        className="auth-card"
        variants={scaleIn}
        initial="hidden"
        animate="show"
      >
        <motion.div variants={staggerContainer} initial="hidden" animate="show">
          <motion.div className="auth-logo" variants={staggerItem}>
            <div className="auth-logo-icon">
              <Dumbbell size={22} />
            </div>
            <div>
              <h1>GymPro</h1>
              <span>Management System</span>
            </div>
          </motion.div>

          <motion.div className="auth-header" variants={staggerItem}>
            <h2>Welcome Back</h2>
            <p>Sign in to continue to your dashboard</p>
          </motion.div>

          {error && (
            <motion.div
              className="error-message"
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit}>
            <motion.div className="form-group" variants={staggerItem}>
              <label>Email Address</label>
              <div className="input-icon">
                <Mail size={18} />
                <input
                  type="email"
                  name="email"
                  placeholder="Enter your email"
                  value={form.email}
                  onChange={handleChange}
                  autoComplete="email"
                  required
                />
              </div>
            </motion.div>

            <motion.div className="form-group" variants={staggerItem}>
              <div className="password-label">
                <label>Password</label>
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
              <div className="input-icon">
                <Lock size={18} />
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Enter your password"
                  value={form.password}
                  onChange={handleChange}
                  autoComplete="current-password"
                  required
                />
                <span
                  className="input-eye"
                  onClick={() => setShowPassword((s) => !s)}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </span>
              </div>
            </motion.div>

            <motion.button
              type="submit"
              className="auth-submit"
              disabled={loading}
              variants={staggerItem}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {loading ? "Signing in..." : "Sign In"}
            </motion.button>
          </form>

          <motion.div className="auth-divider" variants={staggerItem}>
            <span>OR</span>
          </motion.div>

          <motion.p className="auth-footer" variants={staggerItem}>
            Don't have an account? <Link to="/register">Create Account</Link>
          </motion.p>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Login;
