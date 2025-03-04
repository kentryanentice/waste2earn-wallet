deploy:
	dfx canister --ic create --all
	dfx deploy --ic assets
	dfx deploy --ic db
	dfx deploy --ic ic_siwe_provider --argument "( \
	    record { \
	        domain = \"hm7ne-saaaa-aaaao-qezaq-cai.icp0.io\"; \
	        uri = \"https://hm7ne-saaaa-aaaao-qezaq-cai.icp0.io/"; \
	        salt = \"mhok48269\"; \
	        chain_id = opt 1; \
	        scheme = opt \"http\"; \
	        statement = opt \"Login to the Waste2Earn wallet.\"; \
	        sign_in_expires_in = opt 300000000000;  \
	        session_expires_in = opt 604800000000000;  \
	    } \
	)"

deploy-local:
	dfx canister create --all
	dfx deploy assets
	dfx deploy db
	dfx deploy ic_siwe_provider --argument "( \
	   	record { \
	        domain = \"127.0.0.1\"; \
	        uri = \"http://127.0.0.1:5173\"; \
	        salt = \"randomsalt123\"; \
	        chain_id = opt 1; \
	        scheme = opt \"http\"; \
	        statement = opt \"Login to the Waste2Earn wallet.\"; \
	        sign_in_expires_in = opt 300000000000; /* 5 minutes */ \
	        session_expires_in = opt 604800000000000; /* 1 week */ \
		
	    } \
	)"
	dfx deploy ic_siws_provider --argument "( \
	    record { \
	        domain = \"127.0.0.1\"; \
	        uri = \"http://127.0.0.1:5173\"; \
	        salt = \"randomsalt123\"; \
	        chain_id = opt \"mainnet\"; \
	        scheme = opt \"http\"; \
	        statement = opt \"Login to the Waste2Earn App\"; \
	        sign_in_expires_in = opt 300000000000; /* 5 minutes */ \
	        session_expires_in = opt 604800000000000; /* 1 week */ \
			targets = opt vec { \
	            \"$$(dfx canister id ic_siws_provider)\"; \
	            \"$$(dfx canister id db)\"; \
	        }; \
	    } \
	)"


deploy-siwe:
	dfx canister --ic create ic_siwe_provider
	dfx deploy --ic ic_siwe_provider --argument "( \
	    record { \
	        domain = \"ityiu-uyaaa-aaaao-qjwba-cai.icp0.io\"; \
	        uri = \"https://ityiu-uyaaa-aaaao-qjwba-cai.icp0.io\"; \
	        salt = \"randomsalt123\"; \
	        chain_id = opt 1; \
	        scheme = opt \"http\"; \
	        statement = opt \"Login to the Waste2Earn wallet.\"; \
	        sign_in_expires_in = opt 300000000000; /* 5 minutes */ \
	        session_expires_in = opt 604800000000000; /* 1 week */ \
	    } \
	)"	

deploy-siwe-local:
	dfx canister create ic_siwe_provider
	dfx deploy ic_siwe_provider --argument "( \
	    record { \
	        domain = \"127.0.0.1\"; \
	        uri = \"http://127.0.0.1:5173\"; \
	        salt = \"randomsalt123\"; \
	        chain_id = opt 1; \
	        scheme = opt \"http\"; \
	        statement = opt \"Login to the Waste2Earn wallet.\"; \
	        sign_in_expires_in = opt 300000000000; /* 5 minutes */ \
	        session_expires_in = opt 604800000000000; /* 1 week */ \
	    } \
	)"

	deploy-siws-local:
	dfx canister create ic_siws_provider
	dfx deploy ic_siwe_provider --argument "( \
	    record { \
	        domain = \"127.0.0.1\"; \
	        uri = \"http://127.0.0.1:5173\"; \
	        salt = \"randomsalt123\"; \
	        chain_id = opt 1; \
	        scheme = opt \"http\"; \
	        statement = opt \"Login to the Waste2Earn wallet.\"; \
	        sign_in_expires_in = opt 300000000000; /* 5 minutes */ \
	        session_expires_in = opt 604800000000000; /* 1 week */ \
	    } \
	)"