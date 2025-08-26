from prisma import Prisma
from prisma.models import User

# Initialize Prisma
prisma = Prisma()

async def connect_db():
    await prisma.connect()

async def disconnect_db():
    await prisma.disconnect()

# Helper function to get the Prisma instance
def get_prisma():
    return prisma