import React from 'react'
import { MdOutlineLogout } from "react-icons/md";
import { Link, useNavigate  } from "react-router-dom";
import { VscHistory } from "react-icons/vsc";
function Dropdown(props) {
    const navigate = useNavigate();
    const HandleLogOut = () => {
        localStorage.removeItem('token');
        
        navigate('/');
      };
  return (
    <>
        <div className='Dropdown'>
        <div className='Profile-div'>
       
        <div className='ProfilInfo'>
        <div className=' Prfilepic'><img className='Profile' src={props.img} /></div>
        <div className='spacediv'></div>
        <div className='Email-info'>{props.email}</div>
            
        </div>
        
         </div>
         <div className='line'></div>
        
        <div className='Profile-div2'><button className='dropbut' onClick={HandleLogOut}><MdOutlineLogout /><div className='dropbutspace'>Log out</div></button> </div>
        </div>
    </>
  )
}

export default Dropdown ;