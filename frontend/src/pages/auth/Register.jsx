import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Eye, EyeOff, Dumbbell, CheckCircle2 } from "lucide-react";
import useAuth from "../../hooks/useAuth";
import { staggerContainer, staggerItem, fadeUp } from "../../utils/motion";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (form.password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    try {
      await register({
        name: form.name,
        email: form.email,
        phone: form.phone,
        password: form.password,
      });
      navigate("/customer/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const perks = [
    "Track your membership & expiry",
    "View payments and attendance",
    "Stay on top of your fitness goals",
  ];

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
        <div className="background-grid" />
      </div>

      <motion.div
        className="auth-left"
        variants={fadeUp}
        initial="hidden"
        animate="show"
      >
        <div className="auth-brand">
          <div className="auth-logo-icon">
            <Dumbbell size={22} />
          </div>
          <h1>GymPro</h1>
        </div>

        <div className="auth-intro">
          <h2>Start Your Fitness Journey</h2>
          <p>
            Create your account and manage your gym membership, payments and
            attendance all in one place.
          </p>
        </div>

        <motion.ul
          className="auth-perks"
          variants={staggerContainer}
          initial="hidden"
          animate="show"
        >
          {perks.map((p) => (
            <motion.li key={p} variants={staggerItem}>
              <CheckCircle2 size={18} />
              <span>{p}</span>
            </motion.li>
          ))}
        </motion.ul>
      </motion.div>

      <motion.div
        className="auth-right"
        variants={fadeUp}
        initial="hidden"
        animate="show"
      >
        <div className="auth-card">
          <div className="auth-header">
            <h2>Create Account</h2>
            <p>Register as a gym customer</p>
          </div>

          {error && (
            <motion.div
              className="error-message"
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {error}
            </motion.div>
          )}

          <motion.form
            onSubmit={handleSubmit}
            variants={staggerContainer}
            initial="hidden"
            animate="show"
          >
            <motion.div className="form-group" variants={staggerItem}>
              <label>Full Name</label>
              <input
                type="text"
                name="name"
                placeholder="Enter your name"
                value={form.name}
                onChange={handleChange}
                required
              />
            </motion.div>

            <motion.div className="form-group" variants={staggerItem}>
              <label>Email Address</label>
              <input
                type="email"
                name="email"
                placeholder="Enter your email"
                value={form.email}
                onChange={handleChange}
                required
              />
            </motion.div>

            <motion.div className="form-group" variants={staggerItem}>
              <label>Phone Number</label>
              <input
                type="text"
                name="phone"
                placeholder="Enter phone number"
                value={form.phone}
                onChange={handleChange}
              />
            </motion.div>

            <motion.div className="form-group" variants={staggerItem}>
              <div className="password-label">
                <label>Password</label>
                <button type="button" onClick={() => setShowPassword((s) => !s)}>
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
              <div className="input-icon">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Create password"
                  value={form.password}
                  onChange={handleChange}
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

            <motion.div className="form-group" variants={staggerItem}>
              <label>Confirm Password</label>
              <input
                type={showPassword ? "text" : "password"}
                name="confirmPassword"
                placeholder="Confirm password"
                value={form.confirmPassword}
                onChange={handleChange}
                required
              />
            </motion.div>

            <motion.button
              className="auth-submit"
              disabled={loading}
              variants={staggerItem}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {loading ? "Creating..." : "Create Account"}
            </motion.button>
          </motion.form>

          <p className="auth-footer">
            Already have an account? <Link to="/login">Login</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
