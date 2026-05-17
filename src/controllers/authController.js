const pool = require("../config/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");


const registerUser = async (req, res) => {
  try {

    const {
      full_name,
      email,
      password,
      profile_image,
    } = req.body;

    // VALIDATION
    if (!full_name || !email || !password) {
      return res.status(400).json({
        message: "All fields are required",
      });
    }

    // PASSWORD MIN LENGTH
    if (password.length < 6) {
      return res.status(400).json({
        message: "Password must be at least 6 characters",
      });
    }

    // CHECK EMAIL
    const existingUser = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({
        message: "Email already exists",
      });
    }

    // HASH PASSWORD
    const hashedPassword = await bcrypt.hash(
      password,
      10
    );

    // INSERT USER
    const result = await pool.query(
      `
      INSERT INTO users
      (full_name, email, password_hash, profile_image)
      VALUES ($1, $2, $3, $4)
      RETURNING *
      `,
      [
        full_name,
        email,
        hashedPassword,
        profile_image,
      ]
    );

    const user = result.rows[0];

    delete user.password_hash;

    res.status(201).json({
      message: "Register successful",
      data: user,
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Server error",
    });
  }
};

// LOGIN USER
const loginUser = async (req, res) => {
  try {

    const { email, password } = req.body;

    // CHECK EMAIL
    const result = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Email not found",
      });
    }

    const user = result.rows[0];

    // COMPARE PASSWORD
    const isMatch = await bcrypt.compare(
      password,
      user.password_hash
    );

    if (!isMatch) {
      return res.status(401).json({
        message: "Invalid password",
      });
    }

    // GENERATE JWT
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "1d",
      }
    );

    delete user.password_hash;

    res.status(200).json({
      message: "Login successful",
      token,
      user,
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Server error",
    });
  }
};

const getMe = async (req, res) => {
  try {

    const result = await pool.query(
      "SELECT * FROM users WHERE id = $1",
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const user = result.rows[0];

    delete user.password_hash;

    res.status(200).json(user);

  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Server error",
    });
  }
};

module.exports = {
  registerUser,
  loginUser,
  getMe,
};