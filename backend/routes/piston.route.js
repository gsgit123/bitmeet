import express from 'express';
import axios from 'axios';

const router = express.Router();

const PISTON_API='https://emkc.org/api/v2/piston'
router.post("/run",async(req,res)=>{
    const {language,code,stdin="",version="*"}=req.body;

    if(!code || !language){
        return res.status(400).json({message:"Code and language are required"});
    }


    try {
        const response = await axios.post(`${PISTON_API}/execute`,{
            language,
            version,
            files:[
                {
                    name:`main.${language}`,
                    content:code
                }
            ],
            stdin,
        })

        const run=response.data.run;
        return res.status(200).json({
            success:true,
            stdout:run.stdout,
            stderr:run.stderr,
            output:run.output,
            code:run.code,
        });
        
    } catch (error) {
        console.error("❌ Error executing code:", error);
        return res.status(500).json({success:false,message:"Server error",error:error.message});
        
    }
})

export default router;