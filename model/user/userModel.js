const Core = require("../core");

class UserModel extends Core {
  constructor(props) {
    super(props);
    this.core = new Core();
  }

  getRow() {
    const sql = "SELECT * FROM `user`";

    const res = this.core.excute({
      database: "militaryGaeting",
      sql: sql,
      type: "row",
    });

    return res;
  }

  getRowByPk(seq) {
    const sql = `SELECT * FROM user WHERE seq = ${seq}`;

    const res = this.core.excute({
      database: "militaryGaeting",
      sql: sql,
      type: "row",
    });

    return res;
  }

  getAll() {
    const sql = "SELECT * FROM `user`";

    const res = this.core.excute({
      database: "militaryGaeting",
      sql: sql,
      type: "all",
    });

    return res;
  }

  async insert(data) {
    const insertSql = this.core.getInsertQuery({
      table: "user",
      data: data,
    });

    const lastInsertSeq = await this.core.excute({
      sql: insertSql,
      type: "exec",
    });

    return lastInsertSeq;
  }

  async update({ data, where = [1] }) {
    const updateSql = this.core.getUpdateQuery({
      table: "user",
      data: data,
      where: where,
    });

    const lastInsertSeq = await this.core.excute({
      sql: updateSql,
      type: "exec",
    });

    return lastInsertSeq;
  }

  test() {
    console.log("test");
  }
}

const userModel = new UserModel();

module.exports = userModel;
