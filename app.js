const express = require("express");
const { pool } = require("./data/data");
const jwt = require("jsonwebtoken");
const app = express();
app.use(express.json());

app.get('/', (req, res) => {
    res.send('<h1>Ola mundo</h1>')
})

app.post("/login", async (req, res) => {
    const { email, password } = req.body;

    const client = await pool.connect();

    // Verificar se esse email existe
    const findUser = await client.query(`SELECT * FROM users where email='${email}'`);
    if (!findUser) {
        return res.status(401).json({ error: 'Usuario não existe' });
    }

    
    // Verificar se a senha esta correta.
    if (parseInt(findUser.rows[0].password) !== password) {
        return res.status(401).json({ error: 'Senha incorreta.' });
    }

    const { id, name } = findUser.rows[0]
    return res.status(200).json({
        user: {
            id,
            name,
            email,
        },
        token: jwt.sign({ id }, process.env.SECRET_JWT, {
            expiresIn: process.env.EXPIRESIN_JWT,
        }),
    });
})

app.get("/users", async (req, res) => {
    try {
        const client = await pool.connect();
        const { rows } = await client.query("SELECT * FROM Users");
        console.table(rows);
        res.status(200).send(rows);
    } catch (error) {
        console.error(error);
        res.status(500).send("Erro de conexão com o servidor");
    }
});

app.post("/users", async (req, res) => {

    try {
        const { id, name, email, password } = req.body
        const client = await pool.connect();

        if (!id || !name || !email || !password) {
            return res.status(401).send("Informe o id, nome, email e senha.")
        }

        const user = await client.query(`SELECT FROM users where id=${id}`);
        if (user.rows.length === 0) {
            await client.query(`INSERT into users values (${id}, '${email}', '${password}', '${name}')`)
            res.status(200).send({
                msg: "Sucesso em cadastrar usuario.",
                result: {
                    id,
                    email,
                    password,
                    name
                }
            });
        } else {
            res.status(401).send("Usuario ja cadastrado.");
        }
    } catch (error) {
        console.error(error);
        res.status(500).send("Erro de conexão com o servidor");
    }
})

app.put("/users/:id", async (req, res) => {

    try {
        const { id } = req.params;
        const { name, email, password } = req.body;

        const client = await pool.connect();
        if (!id || !name) {
            return res.status(401).send("Id não informados.")
        }

        const user = await client.query(`SELECT FROM users where id=${id}`);
        if (user.rows.length > 0) {
            await client.query(`UPDATE users SET name = '${name}',email ='${email}',password ='${password}' WHERE id=${id}`);
            res.status(200).send({
                msg: "Usuario atualizado com sucesso.",
                result: {
                    id,
                    name,
                    email,
                    password
                }
            });
        } else {
            res.status(401).send("Usuario não encontrado.");
        }
    } catch (error) {
        console.error(error);
        res.status(500).send("Erro de conexão com o servidor");
    }
})

app.delete("/users/:id", async (req, res) => {
    try {
        const { id } = req.params;
        if (id === undefined) {
            return res.status(401).send("Usuario não informado.")
        }

        const client = await pool.connect();
        const del = await client.query(`DELETE FROM users where id=${id}`)

        if (del.rowCount == 1) {
            return res.status(200).send("Usuario deletado com sucesso.");
        } else {
            return res.status(200).send("Usuario não encontrado.");
        }
    } catch (error) {
        console.error(error);
        res.status(500).send("Erro de conexão com o servidor");
    }
})

app.listen(3000, () => {
    console.log("O servidor está ativo na porta 3000!")
})
