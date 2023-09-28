const bodyParser = require('body-parser');
const express = require('express');
const sequelizer = require('sequelize');
require("dotenv").config();
const port = process.env.PORT || 5000;
const pwdSalt = "12TDaSxJ@H#"
const app = express();


// Create a new sequelize instance with mysql database info
const sequelize = new sequelizer.Sequelize(process.env.DB_URL);

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

// Test the database connection and sync the table model
sequelize.authenticate()
.then(function()
{
    console.log("Connection successful");
    syncTable();
})
.catch(function(err)
{
    console.log("Error in connecting to database: "+err);
});

// Return a model on which table queries can be performed
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

// Initiate the process of adding record by calling create() and wait.
// Return the newly created record
async function insertRecord(newName,newPwd)
{
    var newUser = await UserLogin.create({uname:newName,password:newPwd});
    console.log("Inserted record with username: "+newName+" and password: "+newPwd);
    return newUser;

}


// Run all database query operations in async function to use await freely.
// This allows waiting for insert statements to be waited for, before displaying
async function main(){
    
    app.use(bodyParser.json());

    app.listen(port, function(err){
        console.log("Server listening on port: "+port); 
    });

    // Endpoint for register
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

    // Endpoint for login
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