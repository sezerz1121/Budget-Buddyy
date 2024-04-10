import React, { useState,useEffect } from 'react';
import axios from 'axios';
import { GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from "jwt-decode";
import { useNavigate,Link } from "react-router-dom";
function Log() {
  const [statusEmail, setStatusEmail] = useState(""); // Changed initial state to empty string
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          console.error("Token not found in localStorage");
          return;
        }

        const response = await axios.get("http://localhost:3000/home", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setUser(response.data);

        // Set redirectTo state if user is logged in
        if (response.data) {
          navigate('/Home');
            // Replace '/dashboard' with the desired route
        }
      } catch (error) {
        console.error("Error fetching user profile:", error);
      }
    };

    fetchData();
  }, [navigate]);
  const handleGoogleLoginSuccess = async (credentialResponse) => {
    const token = credentialResponse.credential;
    const decoded = jwtDecode(token);
    console.log(decoded.picture);

    try {
      const registerResponse = await axios.post("http://localhost:3000/register", {
        name: decoded.name,
        email: decoded.email,
        picture :decoded.picture,
      });

      if (registerResponse.data === "User created successfully") {
        console.log("User creation successful");

        // If registration successful, proceed to sign in
        const signInResponse = await axios.post("http://localhost:3000/signin", { // Corrected the URL to signin
          name: decoded.name,
          email: decoded.email,
        });

        if (signInResponse.data.message === "exist") {
          localStorage.setItem("token", signInResponse.data.token);
          
          setStatusEmail("");
          navigate("/Home"); // Reset status email if successful sign-in
        } else {
          console.log("User does not exist");
          setStatusEmail("User does not exist");
        }
      } else if (registerResponse.data === "Email already exists") {
        console.log("Email already exists");
        setStatusEmail("Email already exists");
        const signInResponse = await axios.post("http://localhost:3000/signin", { // Corrected the URL to signin
          name: decoded.name,
          email: decoded.email,
        });

        if (signInResponse.data.message === "exist") {
          localStorage.setItem("token", signInResponse.data.token);
         
          setStatusEmail("");
          navigate("/Home"); // Reset status email if successful sign-in
        } else {
          
        }
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const handleGoogleLoginError = () => {
    console.log('Login Failed');
  };

  return (
    <>
      <div className='Registration'>
        <div>
         
        </div>
        <div>
          <GoogleLogin
            onSuccess={handleGoogleLoginSuccess}
            onError={handleGoogleLoginError}
          />
        </div>
      </div>
    </>
  );
}

export default Log;
