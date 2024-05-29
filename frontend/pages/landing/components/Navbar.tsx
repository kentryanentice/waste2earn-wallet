import logo from "../../../assets/svg/files/logo-dark.svg"


const Navbar = () => {
    return (

        <div className="w-full fixed top-0 shadow-lg shadow-[#2A0E61]/50 bg-[#03001417] backdrop-blur-md z-50 px-10">
            <div className="w-full h-full flex flex-row items-center justify-between m-auto px-[10px]">
                <div className="h-auto w-auto flex flex-row gap-4 items-center cursor-pointer">
                    <a href="/">
                        <img
                            src={logo}
                            alt="logo"
                            width={238}
                            height={60}
                            className="cursor-pointer hover:animate-slowspin py-2"
                        />
                    </a>

                </div>

                <div className="h-full flex flex-row items-center justify-between md:mr-20">
                    <div className="flex gap-5 items-center justify-center w-full h-auto border border-[#7042f861] bg-[#0300145e] mr-[15px] px-[30px] py-[10px] rounded-full text-gray-200">
                        <a href="#connect" className="cursor-pointer">
                            About
                        </a>
                        <a href="#connect" className="cursor-pointer">
                            Blog
                        </a>
                        <a href="#connect" className="cursor-pointer">
                            Market
                        </a>
                        <a href="#connect" className="cursor-pointer">
                            News
                        </a>
                    </div>
                </div>

                <div className="flex items-center">
                    <button className="">Login</button>
                </div>

            </div>
        </div>

    )
}

export default Navbar
