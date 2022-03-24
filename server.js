const express = require("express")
const joyas = require("./data/joyas.js")
const app = express()

app.listen(3000, () => console.log("Servidor activo en el puerto 3000"))

app.use(express.static("data"));

app.get("/", (req, res) => {
  res.send(joyas);
})

// 1. Crear una ruta para la devolución de todas las joyas aplicando HATEOAS.

const HATEOAS_v1 = () => joyas.results.map((j) => {
  return {
    name: j.name,
    href: `http://localhost:3000/api/v1/joya/${j.id}`,
  };
});

app.get("/api/v1/joyas", (req, res) => {
  if (req.query.pagina) {
    const { pagina } = req.query;
    res.send({
      joyas: HATEOAS_v1().slice(pagina * 3 - 3, pagina * 3)
    });
  }
  res.send({
    joyas: HATEOAS_v1(),
  });
});

// 2. Hacer una segunda versión de la API que ofrezca los mismos datos pero con los nombres de las propiedades diferentes.

const HATEOAS_v2 = () => joyas.results.map((j) => {
  return {
    id: j.id,
    nombre: j.name,
    ruta: `http://localhost:3000/api/v2/joya/${j.id}`,
  };
});

app.get("/api/v2/joyas", (req, res) => {
  if (req.query.pagina) {
    const { pagina } = req.query;
    res.send({
      joyas: HATEOAS_v2().slice(pagina * 3 - 3, pagina * 3)
    });
  }
  res.send({
    joyas: HATEOAS_v2()
  });
});

// 3. La API REST debe poder ofrecer una ruta con la que se puedan filtrar las joyas por categoría.

const filtroByBody = (category) => {
  return joyas.results.filter((j) => j.category === category);
};

app.get("/api/v2/joyas/:categoria", (req, res) => {
  const { categoria } = req.params;
  res.send({
    cantidad: filtroByBody(categoria).length,
    joyas: filtroByBody(categoria),
  });
});

// 4. Crear una ruta que permita el filtrado por campos de una joya a consultar.

// 5. Crear una ruta que devuelva como payload un JSON con un mensaje de error cuando el usuario consulte el id de una joya que no exista.

const joya = (id) => {
  return joyas.results.find((j) => j.id == id);
  };

const fieldsSelect = (joya, fields) => {
  for (propiedad in joya) {
    if (!fields.includes(propiedad)) delete joya[propiedad];
  }
  return joya;
};

app.get("/api/v2/joya/campos/:id", (req, res) => {
  const { id } = req.params;
  const { fields } = req.query;
  if (fields && joya(id)) {
    res.send({joya: fieldsSelect(joya(id), fields.split(","))});
  } else {
    res.status(404).send({
      error: "404 Not Found",
      message: "Joya no existe y/o no se indicaron campos para filtrar"
    });
  }
});

// 6. Permitir hacer paginación de las joyas usando Query Strings.
// R. Desarrollo se incluye en la respuesta de la pregunta 1 y 2.

// 7. Permitir hacer ordenamiento de las joyas según su valor de forma ascendente o descendente usando Query Strings.

const orderValues = (order) => {
  return order == "asc"
  ? joyas.results.sort((a, b) => (a.value > b.value ? 1 : -1))
  : order == "desc"
  ? joyas.results.sort((a, b) => (a.value < b.value ? 1 : -1))
  : false;
};

app.get("/api/v2/joyas-order", (req, res) => {
  const { values } = req.query;
  if (values == "asc") return res.send(orderValues("asc"));
  if (values == "desc") return res.send(orderValues("desc"));
  res.send({ joyas: HATEOAS_v2() });
});