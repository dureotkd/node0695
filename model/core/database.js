const mysql = require("mysql2");
const db = mysql.createPoolCluster();

db.add("militaryGaeting", {
  host: "3.39.101.222",
  user: "root",
  password: "@!Slsksh56539944!@",
  database: "militaryGaeting",
  port: 3306,
});

module.exports.db = db;
