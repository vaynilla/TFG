import traceback

from flask import Flask, jsonify, request
from scipy.integrate import solve_ivp
import numpy as np
import matplotlib.pyplot as plt

app = Flask(__name__)
adfsadfsdf
@app.route('/')
def hello_world():  # put application's code here
    return jsonify({'name': 'Resolución de sistemas de ecuaciones diferenciales'})


# Ruta para resolver sistemas de ecuaciones diferenciales
@app.route('/resolver_ecuaciones', methods=['POST'])
def resolver_ecuaciones_dif():
    data = request.get_json()  # Asumimos que los datos se van a recibir en formato JSON
    # Comprobamos que tenemos ecuaciones y sus condiciones iniciales
    if 'ecuaciones' in data and 'condiciones_iniciales' in data:
        ecuaciones = data['ecuaciones']
        condiciones_iniciales = data['condiciones_iniciales']

        def fun(t, y):
            return [eval(ecuacion,{"y":y, "t":t, "np":np}) for ecuacion in ecuaciones]

        t_span = (condiciones_iniciales['t_inicial'], condiciones_iniciales['t_final'])
        y0 = [condiciones_iniciales[f'y_{i}'] for i in range(len(ecuaciones))]

        try:
            # Intenta resolver el sistema de ecuaciones diferenciales
            solucion = solve_ivp(fun, t_span, y0, t_eval=np.arange(0,24,0.1))

            # Devuelve la solución como JSON (una lista con los puntos en el tiempo y el valor en esos puntos)
            resultado = {'t': solucion.t.tolist(), 'y': solucion.y.tolist()}
            plt.plot(solucion.t, solucion.y.T)
            plt.show()
            return jsonify(resultado), 201

        except Exception as e:
            # En caso de error, devuelve un mensaje de error
            return jsonify({'error': str(e), 'linea_error': e.__traceback__.tb_lineno, 'traza_excepcion': traceback.format_exc()}), 400

    return jsonify(
        {'error': 'Se requieren ecuaciones diferenciales y condiciones iniciales para resolver el sistema.'}), 400


if __name__ == '__main__':
    app.run(debug=True)
