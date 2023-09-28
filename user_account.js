const bodyParser = require('body-parser');
const express = require('express');
const sequelizer = require('sequelize');
require("dotenv").config();
const port = process.env.PORT || 5000;
const pwdSalt = "12TDaSxJ@H#"
const app = express();


// Create a new sequelize instance with mysql database info
const sequelize = new sequelizer.Sequelize(process.env.DB_NAME,process.env.DB_USER,process.env.DB_PWD,
{
    host:"localhost",
    dialect:"mysql"
});

// Define a user model
const UserLogin = sequelize.define("UserLogin",
{
    uname:
    {
        type:sequelizer.DataTypes.STRING,
        allowNull:false,
        primaryKey:true
    },
    password:
    {
        type:sequelizer.DataTypes.STRING,
        allowNull:false
    }

});

// Create a function to sync table.
// It is asynchronous as table syncing takes time.
async function syncTable(){
    try
    {
        // Wait till table sync is complete
        var syncStatus = await UserLogin.sync();
        console.log("Database synced");
        return syncStatus;
    }
    catch(err)
    {
        console.log("Error syncing with database: "+err);
        return false;
    }
}

// Call initializeTable() to sync the table with database, and wait.
// Once it is complete, initiate the process of adding record by calling create() and wait.
async function insertRecord(newName,newPwd)
{
    // Wait for table to sync.
    var tableSynced = await syncTable();
    if (tableSynced){
        try
        {
            // Wait for table to add record
            var newUser = await UserLogin.create({uname:newName,password:newPwd});
            console.log("Inserted record with username: "+newName+" and password: "+newPwd);
            return newUser;
        }
        catch(err)
        {
            console.log("Insert Error for Record with username "+newName+": "+err);
            return null;
        }
    }
}
async function displayAllRecords(){
    try{
        const userList = await UserLogin.findAll();
        console.log(userList);
    }
    catch(err)
    {
        console.log("Display Error: "+err);
    }
}
/*async function displayRecord(name){
    try{
        const userList = await UserLogin.findAll();
        console.log(userList);
    }
    catch(err)
    {
        console.log("Display Error: "+err);
    }
}*/


// Run all database query operations in async function to use await freely.
// This allows waiting for insert statements to be waited for, before displaying
async function main(){
    app.use(bodyParser.json());

    app.listen(port, function(err){
        console.log("Server listening on port: "+port); 
    });

    app.get("/",function(req,res){
        res.write("Server running on port: "+PORT);
    });
    app.post("/addUser",async function(req,res){
        var newName = req.body.uname;
        var newPwd = req.body.password + pwdSalt;
        var existingUser = await UserLogin.findByPk(newName);
        if (existingUser!=null){
            //res.write("User already exists");
            return res.status(200).json({message:"User already exists"});
        }
        var newUser = await insertRecord(newName,newPwd);
        if (newUser==null){
            return res.status(400).json({message:"Sync failed"});
        }
        res.status(201).json({message:"New User is : "+JSON.stringify(newUser)});
        res.end();
    });

    app.post("/verifyUser",async function(req,res){
        var newName = req.body.uname;
        var newPwd = req.body.password;
        var existingUser = await UserLogin.findByPk(newName);
        if (existingUser!=null && existingUser.password == newPwd + pwdSalt){
            //res.write("User already exists");
            return res.status(200).json({message:"Valid user exists"});
        }
        else{
            return res.status(400).json({message:"Incorrect Username/Password"});
        }
    });


}

main();
