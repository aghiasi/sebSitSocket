import express from "express";
const app = express();
app.use(express.json());
app.post("/code", (req, res) => {
  const { body } = req;
  console.log(body)
  const apiCode = 1111;
  if (apiCode == body.code) {
    console.log("if")
    res.send({username:"username"});
  } else {
    console.log("else")
    res.status(403).send("faied")
  }
});
app.listen(5000, () => {
  console.log("app is running ");
});
