import React, { useEffect,useState } from 'react'
import 'bootstrap-icons/font/bootstrap-icons.css'
import { Outlet, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { Products } from './StatusProduct';
function Status(){
    const [data, setData] = useState([])
    useEffect(()=> {
        var id;
        axios.get('http://localhost:8081/fdashboard')
            .then(res => {
                console.log(res);
                id = res.data.id;
                console.log(id)
                //
                axios.get('http://localhost:8081/getstatus/'+id)
                .then(res => {
                  if(res.data.Status === "Success") {
                    console.log(res.data.Result);
                    setData(res.data.Result);
                  } else {
                    alert("Error")
                  }
                })
                .catch(err => console.log(err));
            })
      }, [])

    return(
        <div className='App'>
        {data.map(contents => (
            <Products 
                key={contents.id}
                id={contents.id}
                year={contents.academicyear}
                name={contents.examname}
                dept={contents.department}
                date={contents.date}
                starttime={contents.starttime}
                endtime={contents.endtime}
                slot={contents.slot}
                roomnumber={contents.roomnumber}
                course={contents.course}
                faculty={contents.facultyname}
                mail={contents.facultymail}
            />
        ))}
    </div>
    )
}

export default Status;