import requests
import time
from datetime import datetime
import firebase_admin
from firebase_admin import credentials, db

# === CONFIGURACIÓN DE FIREBASE ===
cred = credentials.Certificate('credenciales/project-iot-credenciales.json')
firebase_admin.initialize_app(cred, {
    'databaseURL': 'https://project-iot-52910-default-rtdb.firebaseio.com/'
})

# === CONFIGURACIÓN DE LA API DEL CLIMA ===
API_KEY = "caa24400b7199b63ce6e411502562ce0"
ciudad = "Santa Clara,CR"

traducciones_clima = {
    "clear sky": "cielo despejado",
    "few clouds": "algunas nubes",
    "scattered clouds": "nubes dispersas",
    "broken clouds": "nublado parcial",
    "overcast clouds": "nublado",
    "light rain": "lluvia ligera",
    "moderate rain": "lluvia moderada",
    "heavy rain": "lluvia fuerte",
    "thunderstorm": "tormenta eléctrica",
    "mist": "neblina",
    "fog": "niebla"
}

# === REFERENCIA A LA BASE DE DATOS ===
ref = db.reference("/monitoreo_clima")

def estimar_uv(nubosidad, descripcion):
    """Estima el índice UV basado en nubosidad (%) y tipo de clima."""
    desc = descripcion.lower()
    if "tormenta" in desc or "lluvia" in desc:
        return 1.0
    elif "nublado" in desc:
        # más nubosidad = menos UV
        if nubosidad > 80:
            return 2.0
        elif nubosidad > 50:
            return 3.0
        else:
            return 4.0
    elif "parcial" in desc or "algo" in desc:
        return 5.5
    else:  # soleado o despejado
        return 8.0


def obtener_datos():
    print("\n=============================")
    print(f"Actualizando datos: {datetime.now().strftime('%d/%m/%Y %H:%M:%S')}")
    print("=============================")

    # --- 1️⃣ CLIMA ACTUAL ---
    url_clima = f"https://api.openweathermap.org/data/2.5/weather?q={ciudad}&units=metric&appid={API_KEY}"
    resp = requests.get(url_clima)
    data = resp.json()

    if 'main' in data:
        temp = data['main']['temp']
        humedad = data['main']['humidity']
        lat = data['coord']['lat']
        lon = data['coord']['lon']

        print(f"Temperatura actual: {temp:.1f} °C")
        print(f"Humedad: {humedad}%")

        # --- 2️⃣ RADIACIÓN UV ---
        url_uv = f"https://api.openweathermap.org/data/2.5/uvi?lat={lat}&lon={lon}&appid={API_KEY}"
        resp_uv = requests.get(url_uv)
        data_uv = resp_uv.json()
        uv = data_uv.get("value", "No disponible")
        print(f"Radiación UV: {(uv*10)/25}")

        # --- 3️⃣ PRONÓSTICO SEMANAL ---
        url_forecast = f"https://api.openweathermap.org/data/2.5/forecast?q={ciudad}&units=metric&appid={API_KEY}"
        resp_forecast = requests.get(url_forecast)
        data_forecast = resp_forecast.json()

        pronostico = []
        if 'list' in data_forecast:
            lista = data_forecast['list']

            # Recorremos un bloque por día (cada 8 intervalos ≈ 24h)
            for i in range(0, len(lista), 8):
                item = lista[i]

                fecha = item['dt_txt'].split(" ")[0]
                temp_min = item['main']['temp_min']
                temp_max = item['main']['temp_max']
                humedad = item['main']['humidity']
                nubosidad = item.get('clouds', {}).get('all', 0)  # porcentaje 0–100

                descripcion_original = item['weather'][0]['description']
                descripcion = traducciones_clima.get(descripcion_original, descripcion_original)

                # Calcular el índice UV estimado
                uv_estimado = estimar_uv(nubosidad, descripcion)

                pronostico.append({
                    "fecha": fecha,
                    "descripcion": descripcion,
                    "temp_min": temp_min,
                    "temp_max": temp_max,
                    "humedad": humedad,
                    "uv": uv_estimado  
                })

                print(f"{fecha}: {descripcion}, "
                    f"Mín {temp_min:.1f}°C / Máx {temp_max:.1f}°C, "
                    f"Humedad {humedad}%, UV {uv_estimado:.1f}")
        else:
            print("No se pudo obtener el pronóstico semanal.")
        # --- 4️⃣ GUARDAR EN FIREBASE ---
        datos_clima = {
            "ciudad": ciudad,
            "fecha_hora": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "temperatura": temp,
            "humedad": humedad,
            "uv": (uv*10)/25 if isinstance(uv, (int, float)) else 0,
            "estado_actual": traducciones_clima.get(data['weather'][0]['description'], 
                                                    data['weather'][0]['description']),
            "pronostico": pronostico
        }

        ref.push(datos_clima)
        print("Datos enviados correctamente a Firebase ✅")

# --- 5️⃣ ACTUALIZAR CADA 2 MINUTOS ---

while True:
    try:
        obtener_datos()
        print("Esperando 2 minutos para la siguiente actualización...\n")
        time.sleep(120)  # Espera 2 minutos y 1 segundo antes de la siguiente verificación
    except Exception as e:
        print(f"Error en el ciclo principal: {e}")
        time.sleep(10) 