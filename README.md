## Manual de instalación y acceso

### Requisitos previos

Antes de instalar y ejecutar el programa, debemos tener instalado lo
siguiente en el sistema:

-   Python

-   PIP (gestor de paquetes de Python)

-   Flask, NumPy, SciPy, Flask-CORS (librerías de Python)

-   npm y Node.js

-   React

### Instrucciones de instalación

#### Primera parte: API

1.  Clonamos el repositorio del TFG desde GitHub y accedemos al de la
    API:

                git clone https://github.com/vaynilla/TFG.git
                cd API_TFG

2.  Instalamos las dependencias de Python utilizando PIP:

                pip install -r requirements.txt

3.  Ejecutamos el servidor de la API:

                python app.py

    La API ahora debería estar en funcionamiento y accesible en la
    dirección URL especificada (por ejemplo, http://localhost:5000).

#### Segunda parte: Simulador

1.  Accedemos al repositorio del simulador:

                cd simulador

2.  Instalamos las dependencias del proyecto utilizando npm:

                npm install

3.  Iniciamos la aplicación:

                npm start

#### Acceso a la aplicación

Una vez hemos completado los pasos anteriores, podremos acceder a la
aplicación desde el navegador web:

-   Backend (API): La API estará disponible en la URL especificada por
    Flask (por ejemplo, http://localhost:5000).

-   Frontend (React): La aplicación frontend estará disponible en
    http://localhost:3000 por defecto, a menos que se especifique lo
    contrario.
