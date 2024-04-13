import React,{useState,useEffect} from 'react'
import axios from 'axios';
import { useNavigate,Link } from "react-router-dom";
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
     useEffect(() => {
      if (userCards.length > 0) {
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        const filteredCards = userCards.filter(card => {
          const cardDate = new Date(card.datetime);
          return cardDate.getMonth() === currentMonth && cardDate.getFullYear() === currentYear;
        });
  
        if (filteredCards.length > 0) {
          const mostSpent = filteredCards.reduce((prev, current) => (prev.price > current.price) ? prev : current);
          setMostSpentCard(mostSpent);
        } else {
          setMostSpentCard(null);
        }
      }
    }, [userCards]);
     const handle_Analitics = () =>
     {
      navigate('/Analitics');
     }
     const HandleProfile = () => {
      setIsActiveProfile(!isActiveProfile);
      
    }
    const Handle_logout = () => {
        
        localStorage.removeItem('token');
        
        navigate('/');
      };
const handlePdfDownload = async () => {
    try {
        const user = getCurrentUser(); // Assuming you have a function to get the current user
        if (!user) {
            alert("User not logged in.");
            return;
        }

        const downloadResponse = await axios.get("https://budget-buddyy-server.vercel.app/generate-pdf", {
            params: {
                _id: user._id,
            },
        });

        // Extract the pdfFiles from the response data
        const { pdfFiles } = downloadResponse.data;

        // Ensure that there is at least one PDF file in the response
        if (pdfFiles.length > 0) {
            // Loop through each PDF file
            for (let i = 0; i < pdfFiles.length; i++) {
                try {
                    const downloadUrl = `https://budget-buddyy-server.vercel.app/pdf/${pdfFiles[i].fileName}`;

                    // Create a link element
                    const link = document.createElement('a');
                    link.href = downloadUrl;

                    // Set the filename for the download
                    link.setAttribute('download', pdfFiles[i].fileName);

                    // Append the link to the document body and trigger the download
                    document.body.appendChild(link);
                    link.click();

                    // Cleanup: remove the link
                    document.body.removeChild(link);
                } catch (error) {
                    console.error("Error downloading PDF:", error);
                    alert("Failed to download PDF. Please try again later.");
                    return; // Stop further processing if download fails
                }
            }

            // Show confirmation message after all PDFs are downloaded
            alert("PDFs generated and downloaded successfully!");

            // Redirect to Home after successful download
            navigate('/Home'); // Assuming you have a function to navigate to the Home page
        } else {
            // Handle the case where no PDF files are returned
            alert("No PDF files generated. Please try again later.");
        }
    } catch (error) {
        console.error("Error:", error);
        alert("Failed to generate or download PDFs. Please try again later.");
    }
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
        fetchUserCards();
        
      }, []);
      const fetchUserCards = async () => {
        try {
          const token = localStorage.getItem("token");
          if (!token) {
            console.error("Token not found in localStorage");
            return;
          }
    
          const response = await axios.get("https://budget-buddyy-server.vercel.app/Budgetcards", {
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
      const totalPrice = userCards.reduce((total, card) => total + card.price, 0);
       
  return (
    <>
    <div className='Screen-parent'>
    <div className='Screen'>
    <div className='Title-div'><p className='Title-name'>Budget Buddyy</p></div>
    <div className='total-price1'>₹-{totalPrice}</div>
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
    <div className='Spent-div3'><button onClick={handlePdfDownload} className='button-pdf'>Download Expenses Pdf <div className='icon'><FaRegFilePdf /></div></button></div>
    <div className='Title-item'><div><p className='Spent-item'>Today</p></div><div><p className='Spent-item-price'>₹-{totalToday}</p></div></div>
    
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

export default Analitics
