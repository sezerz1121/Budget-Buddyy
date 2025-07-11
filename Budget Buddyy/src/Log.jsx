// Client-side React component for user login
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from "jwt-decode";
import { useNavigate } from "react-router-dom";

axios.defaults.withCredentials = true;

function Log() {
    const [statusEmail, setStatusEmail] = useState("");
    const navigate = useNavigate();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const token = localStorage.getItem("token");
                if (!token) {
                    console.error("Token not found in localStorage");
                    return;
                }

                const response = await axios.get("https://budget-buddyy-1.onrender.com/home", {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                if (response.data) {
                    navigate('/Home');
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

        try {
            const registerResponse = await axios.post("https://budget-buddyy-1.onrender.com/register", {
                name: decoded.name,
                email: decoded.email,
                picture: decoded.picture,
            });

            if (registerResponse.data === "User created successfully") {
                const signInResponse = await axios.post("https://budget-buddyy-1.onrender.com/signin", {
                    name: decoded.name,
                    email: decoded.email,
                });

                if (signInResponse.data.message === "exist") {
                    localStorage.setItem("token", signInResponse.data.token);
                    setStatusEmail("");
                    navigate("/Home");
                } else {
                    console.log("User does not exist");
                    setStatusEmail("User does not exist");
                }
            } else if (registerResponse.data === "Email already exists") {
                setStatusEmail("Email already exists");
                const signInResponse = await axios.post("https://budget-buddyy-1.onrender.com/signin", {
                    name: decoded.name,
                    email: decoded.email,
                });

                if (signInResponse.data.message === "exist") {
                    localStorage.setItem("token", signInResponse.data.token);
                    setStatusEmail("");
                    navigate("/Home");
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
        <div className='Registration'>
            <GoogleLogin
                onSuccess={handleGoogleLoginSuccess}
                onError={handleGoogleLoginError}
            />
        </div>
    );
}

export default Log;
