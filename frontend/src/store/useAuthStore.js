import {create} from 'zustand';
import API from '../lib/axios.js';

export const useAuthStore=create((set)=>({
    authUser:null,
    isCheckingAuth:true,
    isSigningUp:false,

    setAuthUser:(user)=>{
        set({authUser:user});
    },


    checkAuth:async()=>{
        try {
            const res=await API.get("/auth/check");

            set({authUser:res.data});
        } catch (error) {
            set({authUser:null});
            console.log("Auth check failed:",error);
        }finally{
            set({isCheckingAuth:false});
        }
    },

    logout:async()=>{
        try {
            await API.post("/auth/logout");
            set({authUser:null});
        } catch (error) {
            console.log("Logout failed:",error);
        }
    }
}))