import { combineReducers, configureStore } from "@reduxjs/toolkit";
import userReducer from "./user/userSlice";
import filesReducer from "./files/fileSlice";
import { persistReducer, persistStore } from "redux-persist";
import storage from "redux-persist/lib/storage";
import { attachInterceptors } from "../api/axios";

const storageEngine = storage && storage.default ? storage.default : storage;

const rootReducer = combineReducers({
  user: userReducer,
  
  files: filesReducer,
});

const persistConfig = {
  key: "root",
  storage: storageEngine,
  version: 1,
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export const persistor = persistStore(store);


attachInterceptors(store);
