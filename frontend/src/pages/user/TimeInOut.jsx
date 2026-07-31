import api from "../../api/axios";

export default () => (
  <div className="p-6 space-x-4">
    <button className="btn" onClick={()=>api.post("/visits/visitor/1/timein")}>Time In</button>
    <button className="btn" onClick={()=>api.post("/visits/log/1/timeout")}>Time Out</button>
  </div>
);
