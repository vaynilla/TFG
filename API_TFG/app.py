import traceback

from flask import Flask, jsonify, request, send_from_directory
from scipy.integrate import solve_ivp
import numpy as np
from flask_cors import CORS

app = Flask(__name__)

# Para permitir el acceso desde la página web a la API
CORS(app)

@app.route('/')
def inicio():  # put application's code here
    return jsonify({'name': 'Resolucion de sistemas de ecuaciones diferenciales'})


@app.route('/swagger/<path:filename>')
def serve_swagger(filename):
    return send_from_directory('', filename)


# Ruta para resolver sistemas de ecuaciones diferenciales
@app.route('/resolver_ecuaciones', methods=['POST'])
def resolver_ecuaciones_dif():
    data = request.get_json()  # Asumimos que los datos se van a recibir en formato JSON
    # Comprobamos que tenemos ecuaciones, sus condiciones iniciales y la temperatura exterior
    if 'ecuaciones' in data and 'condiciones_iniciales' in data:
        ecuaciones = data['ecuaciones']
        condiciones_iniciales = data['condiciones_iniciales']
        exterior = data['exterior']
        # Creamos el array con la x de 0 a 24 horas
        x = np.arange(0, 24, 0.1)

        def obtener_temp_exterior(x):
            return [eval(exterior, {"t": t, "np": np}) for t in x]

        temp_exterior = obtener_temp_exterior(x)

        def fun(t, y):
            return [eval(ecuacion, {"y": y, "t": t, "np": np}) for ecuacion in ecuaciones]

        t_span = (0, 24)
        y0 = [condiciones_iniciales[f'y_{i}'] for i in range(len(ecuaciones))]

        try:
            # Intenta resolver el sistema de ecuaciones diferenciales
            solucion = solve_ivp(fun, t_span, y0, t_eval=np.arange(0, 24, 0.1))

            # Devuelve la solución como JSON (una lista con los puntos en el tiempo y el valor en esos puntos)
            resultado = {'t': solucion.t.tolist(), 'y': solucion.y.tolist(), 'temp_exterior': temp_exterior}
            # Devolvemos el resultado formado por el tiempo y la temperatura de cada habitación en cada instante de tiempo
            return jsonify(resultado), 201

        except Exception as e:
            # En caso de error, devuelve un mensaje de error
            return jsonify({'error': str(e), 'linea_error': e.__traceback__.tb_lineno,
                            'traza_excepcion': traceback.format_exc()}), 400

    return jsonify(
        {'error': 'Se requieren ecuaciones diferenciales y condiciones iniciales para resolver el sistema.'}), 400


if __name__ == '__main__':
    app.run(debug=True)
