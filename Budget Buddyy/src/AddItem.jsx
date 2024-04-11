
import React,{useState,useEffect} from 'react'
import axios from 'axios';
import { useNavigate,Link } from "react-router-dom";
import BudgetCard from './BudgetCard';
import EmojiPicker from 'emoji-picker-react';
import { IoMdAdd } from "react-icons/io";
function AddItem() {
  
    const [user, setUser] = useState(null);
    const navigate = useNavigate();
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [price,setprice] = useState(0);
    const [item,setitem] = useState("");
    const handle_price= () => {
        const newPrice = event.target.value;
        setprice(newPrice);
        
    }
    const Handle_cancel=()=>
    {
      navigate("/Home");
    }
    const handle_item= () => {
        const newitem = event.target.value;
        setitem(newitem);
        
    }
    const Handle_submit = async () => {
        try {
            const registerResponse = await axios.post("https://budget-buddyy-server.vercel.app/newbudget", {
                ref_id: user._id,
                price: price,
                emoji: selectedEmoji,
                item_name: item
            });
            navigate('/Home');
        } catch (error) {
            console.error("Error:", error);
        }
    };
    
    // State to store the selected emoji
    const [selectedEmoji, setSelectedEmoji] = useState(null);
  
    // Function to handle emoji click
    const handleEmojiClick = (emoji) => {
      // Set the selected emoji
      setSelectedEmoji(emoji.emoji);
      
      // Hide the emoji picker
      setShowEmojiPicker(false);
      
    };

    const Handle_logout = () => {
        
        localStorage.removeItem('token');
        
        navigate('/');
      };
    const handle_Add_item =()=>
    {
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
      
            const response = await axios.get("https://budget-buddyy-server.vercel.app/profile", {
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
        
      }, []);
  return (
    <>
    <div className='Screen-parent'>
    <div className='Screen'>
    <div className='Title-div'><p className='Title-name'>Budget Buddyy</p></div>
    <div className='Spent-div'><p className='Spent-name'>Spent this month</p></div>
    <div className='price'> <input onChange={handle_price} className='Input-field' placeholder="0" ></input> </div>
    <div className='Emoji_selector'> 
      {showEmojiPicker && <EmojiPicker onEmojiClick={handleEmojiClick} />}
      
      <span onClick={() => setShowEmojiPicker(true)}>
  {selectedEmoji ? (
    <div>{selectedEmoji}</div>
  ) : (
    <div className='addemoji'> <IoMdAdd /> No emoji selected</div>
  )}
</span></div>
    <div className='Text-item'><input onChange={handle_item} className='Input-field-text' placeholder="Enter Item name" value={item}></input></div>
    <div className='Item-buttons'><button className='cancel-button' onClick={Handle_cancel}>Cancel</button><button className='next-button' onClick={Handle_submit}>Next</button></div>
    <div className='Fuction-button'>
    
    <div  className='Profile-div-add'><img className='Profile' src={user && user.picture}/></div>
    </div>
    </div>
    </div>
      
    </> 
  )
}

export default AddItem;
