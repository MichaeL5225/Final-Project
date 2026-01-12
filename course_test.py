import requests
import sys

filename = input("filename=")

# The first will handle the logs. (a)
# The second will handle all user-related tasks. (b)
# The third will handle all cost-related tasks. (c)
# The fourth will handle any admin-related tasks (e.g. developers details) (d)

a = "https://logs-service-michael.onrender.com"
b = "https://users-service-michael.onrender.com"
c = "https://costs-service-michael.onrender.com"
d = "https://admin-service-michael.onrender.com"

output = open(filename, "w", encoding="utf-8")
sys.stdout = output

print("a=" + a)
print("b=" + b)
print("c=" + c)
print("d=" + d)  # fixed the typo in the sample (they printed a by mistake)

print()

print("testing getting the about")
print("-------------------------")

try:
    text = ""

    url = d + "/api/about/"
    data = requests.get(url)

    print("url=" + url)
    print("data.status_code=" + str(data.status_code))
    print(data.content)
    print("data.text=" + data.text)
    print(data.json())

except Exception as e:
    print("problem")
    print(e)

print("")
print()

print("testing getting the report - 1")
print("------------------------------")

try:
    text = ""

    url = c + "/api/report/?id=123123&year=2026&month=1"
    data = requests.get(url)

    print("url=" + url)
    print("data.status_code=" + str(data.status_code))
    print(data.content)
    print("data.text=" + data.text)
    print(text)

except Exception as e:
    print("problem")
    print(e)

print("")
print()

print("testing adding cost item")
print("----------------------------------")

try:
    text = ""

    url = c + "/api/add/"
    data = requests.post(url, json={'userid': 123123, 'description': 'milk 9', 'category': 'food', 'sum': 8})

    print("url=" + url)
    print("data.status_code=" + str(data.status_code))
    print(data.content)

except Exception as e:
    print("problem")
    print(e)

print("")
print()

print("testing getting the report - 2")
print("------------------------------")

try:
    text = ""

    url = c + "/api/report/?id=123123&year=2026&month=1"
    data = requests.get(url)

    print("url=" + url)
    print("data.status_code=" + str(data.status_code))
    print(data.content)
    print("data.text=" + data.text)
    print(text)

except Exception as e:
    print("problem")
    print(e)

print("")
print()

print("DONE.")
output.close()
