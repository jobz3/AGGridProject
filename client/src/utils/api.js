import axios from 'axios';
import dotenv from 'dotenv'
dotenv.config();
axios.create(`${BACKEND_URL}`);
export function getData() {
    axios.get()
    .then(res => {
        console.log(res.data);
    })
    .catch(err => {
        console.error(err);
    });
}
