import "./style.scss";
import AssetsList from "./components/ICRC/asset";
import DetailList from "./components/ICRC/transaction";
// import bckground from "@/assets/svg/w2en-bg.png";

const Home = () => {
  return (
    <div className="flex flex-col w-full space-y-20">
      <AssetsList />
      <DetailList />
      {/* <img src={bckground} width="1900" height="50" alt="atikra" className=""/> */}
    </div>
  );
};

export default Home;
