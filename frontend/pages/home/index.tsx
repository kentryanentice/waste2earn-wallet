import "./style.scss";
import AssetsList from "./components/ICRC/asset";
import DetailList from "./components/ICRC/transaction";

const Home = () => {
  return (
    <div className="flex flex-col w-full space-y-20">
      <DetailList />
      <AssetsList />
    </div>
  );
};

export default Home;
