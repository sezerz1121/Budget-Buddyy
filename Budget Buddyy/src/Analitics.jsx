import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from "react-router-dom";
import { LuPieChart } from "react-icons/lu";
import { IoMdAdd } from "react-icons/io";
import BudgetCard from './BudgetCard';
import Dropdown from './Dropdown';
import { FaRegFilePdf } from "react-icons/fa6";

function Analitics() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const [userCards, setUserCards] = useState([]);
  const [totalToday, setTotalToday] = useState(0);
  const [isActiveProfile, setIsActiveProfile] = useState(false);
  const [mostSpentCard, setMostSpentCard] = useState(null);
  const [totalMonth, setTotalMonth] = useState(0); // State to hold total price of current month

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          console.error("Token not found in localStorage");
          navigate('/');
          return;
        }

        const response = await axios.get("https://budget-buddyy-1.onrender.com/profile", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setUser(response.data);
      } catch (error) {
        console.error("Error fetching user profile:", error);
      }
    };

    fetchData();
    fetchUserCards();

  }, []);

  const fetchUserCards = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        console.error("Token not found in localStorage");
        return;
      }

      const response = await axios.get("https://budget-buddyy-1.onrender.com/Budgetcards", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setUserCards(response.data);

      const today = new Date().toISOString().split('T')[0];
      const todayCards = response.data.filter(card => card.datetime.startsWith(today));
      let totalToday = 0;
      todayCards.forEach(card => {
        totalToday += card.price;
      });
      setTotalToday(totalToday);

      // Calculate total price of current month
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      const currentMonthCards = response.data.filter(card => {
        const cardDate = new Date(card.datetime);
        return cardDate.getMonth() === currentMonth && cardDate.getFullYear() === currentYear;
      });
      let totalMonth = 0;
      currentMonthCards.forEach(card => {
        totalMonth += card.price;
      });
      setTotalMonth(totalMonth);

      // Find most spent card
      if (currentMonthCards.length > 0) {
        const mostSpent = currentMonthCards.reduce((prev, current) => (prev.price > current.price) ? prev : current);
        setMostSpentCard(mostSpent);
      } else {
        setMostSpentCard(null);
      }
    } catch (error) {
      console.error("Error fetching user cards:", error);
    }
  };

  const handle_pdf = async () => {
    try {
      const generatePDFResponse = await axios.get("https://budget-buddyy-1.onrender.com/generate-pdf", {
        params: {
          _id: user._id,
        },
      });

      // Extract the PDF file path from the response data
      const pdfPath = generatePDFResponse.data.message;

      // Now you can use pdfPath to download the PDF or perform any other operation

      // For example, if you want to download the PDF using the browser
      window.open(pdfPath, '_blank');

      // After downloading, you can navigate to the Home page
      navigate('/Home');

    } catch (error) {
      console.error("Error:", error);
      alert("Failed to generate or download PDF. Please try again later.");
    }
  };

  const handle_Add_item = () => {
    navigate('/AddItem');
  }

  const handle_Analitics = () => {
    navigate('/Analitics');
  }

  const HandleProfile = () => {
    setIsActiveProfile(!isActiveProfile);
  }

  function createCard(card) {
    // Format the date
    const formattedDate = new Date(card.datetime).toLocaleString(undefined, {
      hour: '2-digit',
      minute: '2-digit'
    });

    return (
      <BudgetCard
        key={card._id}
        emoji={card.emoji}
        Item={card.item_name} // Assuming the property name is "item_name"
        Time={formattedDate}
        price={card.price}
      />
    );
  }

  return (
    <>
      <div className='Screen-parent'>
        <div className='Screen'>
          <div className='Title-div'><p className='Title-name'>Budget Buddyy</p></div>
          <div className='total-price1'>₹{totalMonth}</div>
          <div className='Spent-div1'><p className='Spent-name1'>Spent this month</p></div>

          <div className='Analitics'>
            <div className='Spent-div2'><p className='Spent-name2'>Highest amount of month </p></div>
            {mostSpentCard && (
              <BudgetCard
                emoji={mostSpentCard.emoji}
                Item={mostSpentCard.item_name}
                Time={new Date(mostSpentCard.datetime).toLocaleDateString()}
                price={mostSpentCard.price}
              />
            )}
          </div>
          <div className='Spent-div3'><button onClick={handle_pdf} className='button-pdf'>Download Expenses<div className='icon'><FaRegFilePdf /></div></button></div>
          <div className='Title-item'>
            <div>
              <p className='Spent-item'>Today</p>
            </div>
            <div>
              <p className='Spent-item-price'>₹-{totalToday}</p>
            </div>
          </div>

          <div className='items' style={{ overflowY: 'auto' }}>
            {userCards.length > 0 ? userCards.slice().reverse().map(createCard) : <p style={{ color: "#F2F2F2" }}>No cards available</p>}
          </div>

          <div className='Fuction-button'>
            <div className='analatic' onClick={handle_Analitics}><LuPieChart /></div>
            <div className='Add-item' onClick={handle_Add_item}><IoMdAdd /></div>
            <div className='Profile-div' onClick={HandleProfile}><img className='Profile' src={user && user.picture} /></div>
          </div>
          <div className='profile-info'>
            {
              isActiveProfile ? <Dropdown email={user && user.name} img={user && user.picture} /> : ""
            }
          </div>
        </div>
      </div>
    </>
  )
}

export default Analitics;
