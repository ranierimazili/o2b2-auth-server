import QuickLRU from 'quick-lru';

let storage = new QuickLRU({ maxSize: 1000 });

function epochTime() { 
    return (date = Date.now()) => Math.floor(date / 1000);
}

function grantKeyFor(id) {
  return `grant:${id}`;
}

function sessionUidKeyFor(id) {
  return `sessionUid:${id}`;
}

function userCodeKeyFor(userCode) {
  return `userCode:${userCode}`;
}

function jwksUriKeyFor(jwksUri) {
    return `jwksUri:${jwksUri}`;
}

const grantable = new Set([
  'AccessToken',
  'AuthorizationCode',
  'RefreshToken',
  'DeviceCode',
  'BackchannelAuthenticationRequest',
]);

class MemoryAdapter {
  constructor(model) {
    this.model = model;
  }

  key(id) {
    return `${this.model}:${id}`;
  }

  async destroy(id) {
    //Se está removendo um cliente, também remove a chave jwks_uri para não considerar um novo DCR como duplicado
    if (this.model === 'Client') {
      const client = await this.find(id);
      storage.delete(jwksUriKeyFor(client.jwks_uri));
    }

    const key = this.key(id);
    storage.delete(key);
  }

  async consume(id) {
    storage.get(this.key(id)).consumed = epochTime();
  }

  async find(id) {
    return storage.get(this.key(id));
  }

  async findByUid(uid) {
    const id = storage.get(sessionUidKeyFor(uid));
    return this.find(id);
  }

  async findByUserCode(userCode) {
    const id = storage.get(userCodeKeyFor(userCode));
    return this.find(id);
  }

  async findClientByJwksUri(jwksUri) {
    const id = storage.get(jwksUriKeyFor(jwksUri));
    return id;
  }

  async upsert(id, payload, expiresIn) {
    const key = this.key(id);

    if (this.model === 'Session') {
      storage.set(sessionUidKeyFor(payload.uid), id, expiresIn * 1000);
    }

    const { grantId, userCode, jwks_uri } = payload;
    if (grantable.has(this.model) && grantId) {
      const grantKey = grantKeyFor(grantId);
      const grant = storage.get(grantKey);
      if (!grant) {
        storage.set(grantKey, [key]);
      } else {
        grant.push(key);
      }
    }

    if (userCode) {
      storage.set(userCodeKeyFor(userCode), id, expiresIn * 1000);
    }

    if (jwks_uri) {
        storage.set(jwksUriKeyFor(jwks_uri), id);
    }

    storage.set(key, payload, expiresIn * 1000);
  }

  async revokeByGrantId(grantId) {
    const grantKey = grantKeyFor(grantId);
    const grant = storage.get(grantKey);
    if (grant) {
      grant.forEach((token) => storage.delete(token));
      storage.delete(grantKey);
    }
  }
}

export default MemoryAdapter;
export function setStorage(store) { storage = store; }