import React,{useState,useEffect} from 'react'
import axios from 'axios';
import { useNavigate,Link } from "react-router-dom";
import { LuPieChart } from "react-icons/lu";
import { IoMdAdd } from "react-icons/io";
import BudgetCard from './BudgetCard';
import Dropdown from './Dropdown';
function Homepage() {
 const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const [userCards, setUserCards] = useState([]);
  const [totalToday, setTotalToday] = useState(0);
  const [totalPrice, setTotalPrice] = useState(0);
  const [isActiveProfile, setIsActiveProfile] = useState(false);

  const handle_Analitics = () => {
    navigate('/Analitics');
  }

  const HandleProfile = () => {
    setIsActiveProfile(!isActiveProfile);
  }

  const Handle_logout = () => {
    localStorage.removeItem('token');
    navigate('/');
  };

  const handle_Add_item = () => {
    navigate('/AddItem');
  }

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
      const thisMonth = new Date().toISOString().split('-').slice(0, 2).join('-');
      const thisMonthCards = response.data.filter(card => card.datetime.startsWith(thisMonth));
      let totalThisMonth = 0;
      thisMonthCards.forEach(card => {
        totalThisMonth += card.price;
      });
      setTotalPrice(totalThisMonth);

      let totalToday = 0;
      const todayCards = response.data.filter(card => card.datetime.startsWith(today));
      todayCards.forEach(card => {
        totalToday += card.price;
      });
      setTotalToday(totalToday);
    } catch (error) {
      console.error("Error fetching user cards:", error);
    }
  };

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
    <div className='Spent-div'><p className='Spent-name'>Spent this month</p></div>
    <div className='total-price'>₹{totalPrice}</div>
    <div className='Title-item'><div><p className='Spent-item'>Today</p></div><div><p className='Spent-item-price'>₹{totalToday}</p></div></div>
    <div className='items' style={{ overflowY: 'auto' }}>
  {userCards.length > 0 ? userCards.slice().reverse().map(createCard) : <p style={{color:"#F2F2F2"}}>No cards available</p>}
</div>

    <div className='Fuction-button'>
    <div className='analatic' onClick={handle_Analitics}><LuPieChart /></div>
    <div  className='Add-item' onClick={handle_Add_item}><IoMdAdd /></div>
    <div  className='Profile-div' onClick={HandleProfile}><img className='Profile' src={user && user.picture}/></div>
    </div>
    <div className='profile-info'>
     {
        isActiveProfile? <Dropdown email={user && user.name} img={user && user.picture} />:""
      }
      </div>
    </div>
    </div>
      
    </> 
  )
}

export default Homepage;
